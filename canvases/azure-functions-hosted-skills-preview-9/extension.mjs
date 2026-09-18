import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { cp, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { renderPublicHostedSkillsHtml } from "./canonical-renderer.mjs";
import {
	externalCommandSpawnSpec,
	runExternalCommandText,
	terminateChildProcess,
} from "./external-command.mjs";

const DISPLAY_NAME = "Azure Functions Hosted Skills (preview-9)";
const ARTIFACT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.join(ARTIFACT_ROOT, "templates", "hosted-skill");
const OWNERSHIP_DIRECTORY = ".azure-functions-hosted-skills-preview-9";
const OWNERSHIP_FILE = "ownership.json";
const MODEL_FILE = "model.json";
const LOCAL_SETTINGS_FILE = "local.settings.json";
const localHosts = new Map();
const azuriteInstallPromises = new Map();
const TEST_MODE = process.env.FUNCTION_CANVAS_TEST_MODE === "1";
const WORKSPACE_ROOT = path.resolve(process.env.FUNCTION_CANVAS_WORKSPACE_ROOT || path.join(homedir(), "AzureFunctionsHostedSkills"));
const AZURITE_VERSION = "3.37.0";
const FOUNDRY_MODEL_CHOICES = Object.freeze([
	{ deploymentName: "gpt-mini-latest", modelName: "gpt-5.4-mini", modelVersion: "2026-03-17", skuName: "GlobalStandard", capacity: 200 },
	{ deploymentName: "gpt-latest", modelName: "gpt-5.6-sol", modelVersion: "2026-07-09", skuName: "GlobalStandard", capacity: 20 },
]);

function safeEnvironment() {
	const allowed = [
		"AZURE_CONFIG_DIR",
		"COMSPEC",
		"CURL_CA_BUNDLE",
		"HOME",
		"HTTPS_PROXY",
		"HTTP_PROXY",
		"NO_PROXY",
		"PATH",
		"REQUESTS_CA_BUNDLE",
		"SSL_CERT_FILE",
		"USERPROFILE",
		"XDG_CONFIG_HOME",
	];
	return Object.fromEntries(allowed.flatMap((key) => process.env[key] == null ? [] : [[key, process.env[key]]]));
}

async function waitForIndexedFunctions(port, child, output, timeoutMs = 15_000) {
	const deadline = Date.now() + timeoutMs;
	let lastStatus = "";
	while (Date.now() < deadline) {
		if (child.exitCode !== null) {
			throw new Error(`Azure Functions Core Tools exited before functions were indexed. ${output()}`.trim());
		}
		try {
			const response = await fetch(`http://127.0.0.1:${port}/admin/functions`, {
				signal: AbortSignal.timeout(1_000),
			});
			const text = await response.text();
			lastStatus = `${response.status} ${text}`.trim();
			if (response.ok) {
				const functions = JSON.parse(text);
				const names = Array.isArray(functions)
					? functions.map((item) => String(item?.name || "")).filter(Boolean)
					: [];
				if (names.includes("daily_repo_digest_http")) return names;
			}
		} catch (error) {
			lastStatus = shortError(error);
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Timed out waiting for Core Tools to index daily_repo_digest_http. Last probe: ${lastStatus || "no response"}. ${output()}`.trim());
}

function shortError(error) {
	return String(error?.stderr || error?.message || error).replace(/\s+/g, " ").trim().slice(0, 600);
}

function assertConfirmed(input) {
	if (input.confirm === false) throw new Error("Confirm this workspace change before continuing.");
}

function safeWorkspacePath(workspacePath) {
	if (typeof workspacePath !== "string" || !path.isAbsolute(workspacePath)) {
		throw new Error("Choose an absolute local workspace path.");
	}
	return path.resolve(workspacePath);
}

async function assertTemplateSafe(directory = TEMPLATE_ROOT) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const child = path.join(directory, entry.name);
		if (entry.isSymbolicLink() || !entry.isFile() && !entry.isDirectory()) {
			throw new Error(`The bundled starter contains an unsupported entry: ${entry.name}`);
		}
		if (entry.isDirectory()) await assertTemplateSafe(child);
	}
}

async function createHostedSkill(input) {
	assertConfirmed(input);
	const destination = safeWorkspacePath(input.workspacePath);
	try {
		await lstat(destination);
		throw new Error("The selected workspace already exists. Choose a new empty location; existing files are never overwritten.");
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	await assertTemplateSafe();
	await mkdir(path.dirname(destination), { recursive: true });
	await cp(TEMPLATE_ROOT, destination, { recursive: true, errorOnExist: true, force: false });
	await mkdir(path.join(destination, OWNERSHIP_DIRECTORY));
	await writeFile(
		path.join(destination, "src", LOCAL_SETTINGS_FILE),
		`${JSON.stringify({ IsEncrypted: false, Values: { FUNCTIONS_WORKER_RUNTIME: "python", AzureWebJobsStorage: "UseDevelopmentStorage=true" } }, null, 2)}\n`,
		{ mode: 0o600 },
	);
	await writeFile(
		path.join(destination, OWNERSHIP_DIRECTORY, OWNERSHIP_FILE),
		`${JSON.stringify({ version: 1, id: randomUUID() }, null, 2)}\n`,
		{ mode: 0o600 },
	);
	return { ok: true, workspacePath: destination };
}

function modelConfiguration(input) {
	const provider = input.provider === "foundry" ? input.provider : "";
	const model = String(input.model || "").trim();
	const endpoint = String(input.endpoint || "").trim();
	if (!provider || !model || !endpoint) throw new Error("Choose a Microsoft Foundry endpoint and enter its model or deployment name.");
	const url = new URL(endpoint);
	if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
		throw new Error("Use a plain HTTPS model endpoint without credentials or query values.");
	}
	const managedIdentityClientId = String(input.managedIdentityClientId || "").trim();
	if (managedIdentityClientId && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(managedIdentityClientId)) {
		throw new Error("Use a valid managed identity client ID.");
	}
	return { provider, model, endpoint, ...(managedIdentityClientId ? { managedIdentityClientId } : {}) };
}

async function configureHostedSkill(input) {
	assertConfirmed(input);
	const workspacePath = safeWorkspacePath(input.workspacePath);
	try {
		await readFile(path.join(workspacePath, OWNERSHIP_DIRECTORY, OWNERSHIP_FILE), "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") {
			throw new Error("The selected workspace was not created by this canvas, so its files will not be changed.");
		}
		throw error;
	}
	const metadata = modelConfiguration(input);
	await writeFile(
		path.join(workspacePath, OWNERSHIP_DIRECTORY, MODEL_FILE),
		`${JSON.stringify(metadata, null, 2)}\n`,
		{ mode: 0o600 },
	);
	let existingValues = {};
	try {
		const existing = JSON.parse(await readFile(path.join(workspacePath, "src", LOCAL_SETTINGS_FILE), "utf8"));
		if (existing?.Values && typeof existing.Values === "object" && !Array.isArray(existing.Values)) {
			existingValues = existing.Values;
		}
	} catch (error) {
		if (error?.code !== "ENOENT") {
			throw new Error(`Could not read existing local settings: ${shortError(error)}`);
		}
	}
	const localSettings = {
		IsEncrypted: false,
		Values: {
			...existingValues,
			FUNCTIONS_WORKER_RUNTIME: "python",
			AzureWebJobsStorage: "UseDevelopmentStorage=true",
			AZURE_FUNCTIONS_AGENTS_PROVIDER: "foundry",
			FOUNDRY_PROJECT_ENDPOINT: metadata.endpoint,
			FOUNDRY_MODEL: metadata.model,
			AZURE_FUNCTIONS_AGENTS_MODEL: metadata.model,
			...(metadata.managedIdentityClientId ? { AZURE_CLIENT_ID: metadata.managedIdentityClientId } : {}),
		},
	};
	await writeFile(
		path.join(workspacePath, "src", LOCAL_SETTINGS_FILE),
		`${JSON.stringify(localSettings, null, 2)}\n`,
		{ mode: 0o600 },
	);
	return { ok: true, workspacePath };
}

async function assertOwnedWorkspace(workspacePath) {
	const resolved = safeWorkspacePath(workspacePath);
	try {
		await readFile(path.join(resolved, OWNERSHIP_DIRECTORY, OWNERSHIP_FILE), "utf8");
		return resolved;
	} catch (error) {
		if (error?.code === "ENOENT") throw new Error("The selected workspace was not created by this canvas, so its files will not be changed.");
		throw error;
	}
}

function validPort(value) {
	const port = Number(value);
	if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Choose a local port from 1024 through 65535.");
	return port;
}

function localRuntimeEnvironment(venvDirectory, venvPython) {
	const env = safeEnvironment();
	return {
		...env,
		VIRTUAL_ENV: venvDirectory,
		PATH: `${path.dirname(venvPython)}${path.delimiter}${env.PATH || ""}`,
	};
}

function waitForChildClose(child, timeoutMs = 5_000) {
	if (!child || child.exitCode !== null) return Promise.resolve();
	return new Promise((resolve) => {
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(finish, timeoutMs);
		child.once("close", finish);
	});
}

async function stopChild(child) {
	if (!child || child.exitCode !== null) return;
	terminateChildProcess(child);
	await waitForChildClose(child, 2_000);
	if (child.exitCode === null) {
		terminateChildProcess(child, "SIGKILL");
		await waitForChildClose(child, 2_000);
	}
}

function tcpPortListening(port) {
	return new Promise((resolve) => {
		const socket = net.createConnection({ host: "127.0.0.1", port });
		const finish = (value) => {
			socket.removeAllListeners();
			socket.destroy();
			resolve(value);
		};
		socket.setTimeout(250);
		socket.once("connect", () => finish(true));
		socket.once("timeout", () => finish(false));
		socket.once("error", () => finish(false));
	});
}

async function waitForPorts(ports, timeoutMs, child, output, launchError = () => null) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (launchError()) {
			throw new Error(`Unable to start Azurite. ${shortError(launchError())} ${output()}`.trim());
		}
		if (child?.exitCode !== null) {
			throw new Error(`Azurite exited before its storage endpoints were ready. ${output()}`.trim());
		}
		if ((await Promise.all(ports.map(tcpPortListening))).every(Boolean)) return;
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	throw new Error(`Timed out waiting for Azurite ports ${ports.join(", ")}. ${output()}`.trim());
}

async function probeAzuriteServices() {
	const probes = [
		"http://127.0.0.1:10000/devstoreaccount1?comp=list",
		"http://127.0.0.1:10001/devstoreaccount1?comp=list",
		"http://127.0.0.1:10002/devstoreaccount1/Tables",
	];
	return Promise.all(probes.map(async (url) => {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
			return /^Azurite-/i.test(response.headers.get("server") || "");
		} catch {
			return false;
		}
	}));
}

async function waitForHostRunning(port, child, output, timeoutMs = 45_000) {
	const deadline = Date.now() + timeoutMs;
	let lastStatus = "";
	while (Date.now() < deadline) {
		if (child.exitCode !== null) {
			throw new Error(`Azure Functions Core Tools exited before the host became healthy. ${output()}`.trim());
		}
		try {
			const response = await fetch(`http://127.0.0.1:${port}/admin/host/status`, {
				signal: AbortSignal.timeout(1_000),
			});
			const text = await response.text();
			lastStatus = `${response.status} ${text}`.trim();
			if (response.ok) {
				const status = JSON.parse(text);
				if (status?.state === "Running") return status;
			}
		} catch (error) {
			lastStatus = shortError(error);
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Timed out waiting for /admin/host/status to report Running. Last probe: ${lastStatus || "no response"}. ${output()}`.trim());
}

function azuriteBinDirectory(installRoot) {
	return path.join(installRoot, "node_modules", ".bin");
}

async function ensureAzuriteCommand(args, env, onOutput) {
	const artifactBinDirectory = path.join(ARTIFACT_ROOT, "node_modules", ".bin");
	try {
		return await externalCommandSpawnSpec("azurite", args, {
			env,
			extraDirectories: [artifactBinDirectory],
		});
	} catch (error) {
		if (error?.code !== "EXTERNAL_COMMAND_NOT_FOUND") throw error;
	}
	const installRoot = path.join(WORKSPACE_ROOT, ".tools", `azurite-${AZURITE_VERSION}`);
	const binDirectory = azuriteBinDirectory(installRoot);
	try {
		return await externalCommandSpawnSpec("azurite", args, { env, extraDirectories: [binDirectory] });
	} catch (error) {
		if (error?.code !== "EXTERNAL_COMMAND_NOT_FOUND") throw error;
	}
	let installPromise = azuriteInstallPromises.get(installRoot);
	if (!installPromise) {
		installPromise = (async () => {
			await mkdir(installRoot, { recursive: true });
			onOutput?.(`Installing Azurite ${AZURITE_VERSION} into the extension tool cache...\n`);
			await runExternalCommandText(
				"npm",
				[
					"install",
					"--prefix", installRoot,
					"--no-audit",
					"--no-fund",
					"--package-lock=false",
					"--ignore-scripts",
					`azurite@${AZURITE_VERSION}`,
				],
				{ env, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
			);
		})();
		azuriteInstallPromises.set(installRoot, installPromise);
	}
	try {
		await installPromise;
	} catch (error) {
		azuriteInstallPromises.delete(installRoot);
		throw new Error(`Could not install Azurite ${AZURITE_VERSION}: ${shortError(error)}`);
	}
	return externalCommandSpawnSpec("azurite", args, { env, extraDirectories: [binDirectory] });
}

async function closeLocalHost(workspacePath, state = localHosts.get(workspacePath)) {
	if (!state) return;
	if (state.stopPromise) return state.stopPromise;
	state.stopping = true;
	state.stopPromise = (async () => {
		await stopChild(state.child);
		await stopChild(state.azurite);
		if (localHosts.get(workspacePath) === state) localHosts.delete(workspacePath);
	})().finally(() => {
		state.stopPromise = null;
	});
	return state.stopPromise;
}

async function startLocalHostedSkill(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const port = validPort(input.port);
	if (localHosts.has(workspacePath)) throw new Error("This workspace already has a local function host.");
	if (TEST_MODE) {
		const child = new EventEmitter();
		child.exitCode = null;
		let server;
		child.kill = () => {
			server?.close(() => {
				child.exitCode = 0;
				child.emit("close", 0, "SIGTERM");
			});
			return true;
		};
		server = createServer((request, response) => {
			if (request.method === "GET" && request.url === "/admin/host/status") {
				response.writeHead(200, { "content-type": "application/json" });
				response.end('{"state":"Running"}');
				return;
			}
			if (request.method === "GET" && request.url === "/admin/functions") {
				response.writeHead(200, { "content-type": "application/json" });
				response.end('[{"name":"daily_repo_digest_http"}]');
				return;
			}
			if (request.method === "POST" && request.url === "/api/hosted-skill") {
				response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
				response.end("Mock hosted-skill digest: all requested repository activity is healthy.");
				return;
			}
			response.writeHead(404);
			response.end();
		});
		await new Promise((resolve, reject) => {
			server.once("error", reject);
			server.listen(0, "127.0.0.1", resolve);
		});
		const mockPort = server.address().port;
		const state = { child, port: mockPort, output: `Mock Azure Functions host listening on http://127.0.0.1:${mockPort}` };
		child.once("close", () => localHosts.delete(workspacePath));
		localHosts.set(workspacePath, state);
		return {
			ok: true,
			workspacePath,
			port: mockPort,
			output: state.output,
			hostStatus: { state: "Running" },
			functions: ["daily_repo_digest_http"],
		};
	}
	const sourceDirectory = path.join(workspacePath, "src");
	const venvDirectory = path.join(sourceDirectory, ".venv");
	const venvPython = path.join(venvDirectory, process.platform === "win32" ? "Scripts/python.exe" : "bin/python3");
	const requirements = await readFile(path.join(workspacePath, "requirements.txt"), "utf8");
	const requirementsHash = createHash("sha256").update(requirements).digest("hex");
	const marker = path.join(venvDirectory, ".copilot-installed");
	let installedHash = "";
	try { installedHash = (await readFile(marker, "utf8")).trim(); } catch (error) { if (error?.code !== "ENOENT") throw error; }
	try {
		await lstat(venvPython);
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
		input.onOutput?.("Preparing an isolated Python environment...\n");
		let created = false;
		const failures = [];
		for (const command of process.platform === "win32" ? ["python", "py"] : ["python3.13", "python3"]) {
			try {
				const args = command === "py" ? ["-3.13", "-m", "venv", ".venv"] : ["-m", "venv", ".venv"];
				await runExternalCommandText(command, args, { cwd: sourceDirectory, env: safeEnvironment() });
				created = true;
				break;
			} catch (candidateError) {
				failures.push(`${command}: ${shortError(candidateError)}`);
			}
		}
		if (!created) throw new Error(`Could not create a Python 3.13 environment. ${failures.join(" ")}`);
	}
	if (installedHash !== requirementsHash) {
		input.onOutput?.("Installing required Python packages into the isolated environment...\n");
		await runExternalCommandText(venvPython, ["-m", "pip", "install", "-q", "-r", "../requirements.txt"], {
			cwd: sourceDirectory,
			env: localRuntimeEnvironment(venvDirectory, venvPython),
		});
		await writeFile(marker, `${requirementsHash}\n`, { mode: 0o600 });
	}
	const azuriteDirectory = path.join(workspacePath, ".azurite");
	await mkdir(azuriteDirectory, { recursive: true });
	const runtimeEnv = localRuntimeEnvironment(venvDirectory, venvPython);
	let azuriteOutput = "";
	const appendAzurite = (chunk) => {
		azuriteOutput = `${azuriteOutput}${chunk}`.slice(-4_000);
		input.onOutput?.(String(chunk));
	};
	const storagePortBase = Number(process.env.FUNCTION_CANVAS_TEST_STORAGE_PORT_BASE || 10000);
	const storagePorts = [storagePortBase, storagePortBase + 1, storagePortBase + 2];
	const occupiedStoragePorts = await Promise.all(storagePorts.map(tcpPortListening));
	if (occupiedStoragePorts.some(Boolean) && !occupiedStoragePorts.every(Boolean)) {
		throw new Error("Azurite ports 10000-10002 are partially occupied. Stop the conflicting process and retry.");
	}
	let azurite = null;
	let azuriteLaunchError = null;
	if (occupiedStoragePorts.every(Boolean)) {
		const azuriteServices = await probeAzuriteServices();
		if (!azuriteServices.every(Boolean)) {
			throw new Error("Ports 10000-10002 are occupied, but they do not expose compatible Azurite Blob, Queue, and Table services.");
		}
		input.onOutput?.("Reusing the storage emulator already listening on ports 10000-10002.\n");
	} else {
		input.onOutput?.("Starting local storage emulator...\n");
		const azuriteArgs = [
			"--silent",
			"--location", azuriteDirectory,
			"--skipApiVersionCheck",
			...(storagePortBase === 10000
				? []
				: [
						"--blobPort", String(storagePorts[0]),
						"--queuePort", String(storagePorts[1]),
						"--tablePort", String(storagePorts[2]),
					]),
		];
		const azuriteCommand = await ensureAzuriteCommand(azuriteArgs, runtimeEnv, input.onOutput);
		azurite = spawn(azuriteCommand.file, azuriteCommand.args, {
			stdio: ["ignore", "pipe", "pipe"],
			detached: process.platform !== "win32",
			env: azuriteCommand.env,
			windowsHide: true,
			windowsVerbatimArguments: azuriteCommand.windowsVerbatimArguments,
		});
		azurite.stdout.on("data", appendAzurite);
		azurite.stderr.on("data", appendAzurite);
		azurite.once("error", (error) => {
			azuriteLaunchError = error;
			appendAzurite(`Unable to start Azurite: ${shortError(error)}\n`);
		});
	}
	const state = { child: null, azurite, port, output: "", stopping: false, stopPromise: null };
	localHosts.set(workspacePath, state);
	try {
		if (azurite) await waitForPorts(storagePorts, 20_000, azurite, () => azuriteOutput, () => azuriteLaunchError);
	} catch (error) {
		await closeLocalHost(workspacePath, state);
		throw error;
	}
	let funcCommand;
	let child;
	try {
		funcCommand = await externalCommandSpawnSpec("func", ["start", "--port", String(port)], { env: runtimeEnv });
		child = spawn(funcCommand.file, funcCommand.args, {
			cwd: sourceDirectory,
			env: funcCommand.env,
			stdio: ["ignore", "pipe", "pipe"],
			detached: process.platform !== "win32",
			windowsHide: true,
			windowsVerbatimArguments: funcCommand.windowsVerbatimArguments,
		});
	} catch (error) {
		await closeLocalHost(workspacePath, state);
		throw new Error(`Unable to start Azure Functions Core Tools: ${shortError(error)}`);
	}
	state.child = child;
	let ready;
	let failed;
	const readyPromise = new Promise((resolve, reject) => { ready = resolve; failed = reject; });
	readyPromise.catch(() => {});
	const append = (chunk) => {
		const text = String(chunk);
		state.output = `${state.output}${text}`.slice(-12_000);
		input.onOutput?.(text, state.output);
		if (/Host started|Functions:\s|Worker process started|listening on/i.test(state.output)) ready();
	};
	child.stdout.on("data", append);
	child.stderr.on("data", append);
	let launchError = null;
	child.once("error", (error) => {
		launchError = error;
		append(`Unable to start Azure Functions Core Tools: ${shortError(error)}`);
		failed(error);
	});
	await new Promise((resolve) => {
		child.once("spawn", resolve);
		child.once("error", resolve);
	});
	child.once("close", (code, signal) => {
		const detail = `Function host stopped (${signal || `exit ${code ?? "unknown"}`}).`;
		append(detail);
		input.onExit?.({ code, signal, output: state.output, detail });
		if (!state.stopping && code !== 0 && signal !== "SIGTERM") failed(new Error(`${detail} ${state.output}`));
		void closeLocalHost(workspacePath, state);
	});
	if (launchError) throw new Error(`Unable to start Azure Functions Core Tools: ${shortError(launchError)}`);
	try {
		await Promise.race([
			readyPromise,
			waitForHostRunning(port, child, () => state.output),
		]);
		const hostStatus = await waitForHostRunning(port, child, () => state.output);
		const functions = await waitForIndexedFunctions(port, child, () => state.output);
		return { ok: true, workspacePath, port, output: state.output, hostStatus, functions };
	} catch (error) {
		await closeLocalHost(workspacePath, state);
		throw error;
	}
}

async function invokeLocalHostedSkill(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const state = localHosts.get(workspacePath);
	if (!state) throw new Error("Start the local function host for this workspace first.");
	const prompt = String(input.prompt || "").trim();
	if (!prompt) throw new Error("Enter a prompt to invoke the hosted skill.");
	const response = await fetch(`http://127.0.0.1:${state.port}/api/hosted-skill`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ prompt }),
	});
	const text = await response.text();
	return {
		ok: response.ok,
		status: response.status,
		commandOutput: state.output,
		response: text,
	};
}

async function prepareFoundryDeployment(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const metadata = JSON.parse(await readFile(path.join(workspacePath, OWNERSHIP_DIRECTORY, MODEL_FILE), "utf8"));
	if (metadata.provider !== "foundry" || !metadata.endpoint || !metadata.model) {
		throw new Error("Configure a Microsoft Foundry endpoint and model before deployment preparation.");
	}
	const settings = await readFile(path.join(workspacePath, "src", LOCAL_SETTINGS_FILE), "utf8");
	if (/(?:GITHUB|(?:API|ACCESS)[_-]?KEY|TOKEN|SECRET|AUTHORIZATION)/i.test(settings)) {
		throw new Error("Local-only credentials or GitHub configuration cannot be included in deployment preparation.");
	}
	return {
		ok: false,
		workspacePath,
		model: metadata.model,
		message: "Deployment is not configured for this starter. Add managed identity and Microsoft Foundry RBAC to your own Azure deployment configuration, then retry deployment preparation.",
	};
}

async function doctorHostedSkill() {
	if (TEST_MODE) {
		return {
			ok: true,
			checks: [
				{ id: "azure-cli", ok: true, detail: "Fixture Azure CLI is available." },
				{ id: "core-tools", ok: true, detail: "Fixture Azure Functions Core Tools 4.0." },
			],
		};
	}
	const checks = await Promise.all([
		runExternalCommandText("az", ["account", "show", "--output", "json"], { env: safeEnvironment(), timeout: 30_000 })
			.then(() => ({ id: "azure-cli", ok: true, detail: "Signed in Azure CLI is available." }))
			.catch((error) => ({ id: "azure-cli", ok: false, detail: shortError(error) })),
		runExternalCommandText("func", ["--version"], { env: safeEnvironment(), timeout: 30_000 })
			.then(({ stdout }) => ({ id: "core-tools", ok: true, detail: stdout.trim() }))
			.catch((error) => ({ id: "core-tools", ok: false, detail: shortError(error) })),
	]);
	return { ok: checks.every((check) => check.ok), checks };
}

async function openHostedSkillInVsCode(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	if (TEST_MODE) return { ok: true, workspacePath };
	try {
		await runExternalCommandText("code", [workspacePath], { env: safeEnvironment(), timeout: 30_000, windowsHide: true });
		return { ok: true, workspacePath };
	} catch (error) {
		throw new Error(`Could not open VS Code: ${shortError(error)}`);
	}
}

async function editHostedSkillInstructions(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const filePath = path.join(workspacePath, "src", "daily-repo-digest.agent.md");
	if (TEST_MODE) return { ok: true, workspacePath, filePath };
	try {
		await runExternalCommandText("code", [workspacePath, "--goto", filePath], { env: safeEnvironment(), timeout: 30_000, windowsHide: true });
		return { ok: true, workspacePath, filePath };
	} catch (error) {
		throw new Error(`Could not open VS Code: ${shortError(error)}`);
	}
}

async function stopLocalHostedSkill(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const state = localHosts.get(workspacePath);
	if (!state) throw new Error("This workspace does not have a local function host.");
	await closeLocalHost(workspacePath, state);
	return { ok: true, workspacePath };
}

async function azJson(args) {
	if (TEST_MODE && args[0] === "account" && args[1] === "list") {
		const rows = [{
			id: "00000000-0000-0000-0000-000000000001",
			name: "Fixture subscription",
			state: "Enabled",
			isDefault: true,
		}];
		if (process.env.FUNCTION_CANVAS_TEST_RACE === "1") rows.push({
			id: "00000000-0000-0000-0000-000000000002",
			name: "Newer subscription",
			state: "Enabled",
			isDefault: false,
		});
		return rows;
	}
	if (TEST_MODE && args[0] === "resource" && args[1] === "list") {
		const subscription = String(args[args.indexOf("--subscription") + 1] || "00000000-0000-0000-0000-000000000001");
		if (process.env.FUNCTION_CANVAS_TEST_RACE === "1") {
			await new Promise((resolve) => setTimeout(resolve, subscription.endsWith("1") ? 150 : 10));
		}
		return [{
			id: `/subscriptions/${subscription}/resourceGroups/fixture-rg/providers/Microsoft.CognitiveServices/accounts/fixture-foundry/projects/${subscription.endsWith("2") ? "newer-project" : "fixture-project"}`,
			name: subscription.endsWith("2") ? "newer-project" : "fixture-project",
		}];
	}
	if (TEST_MODE && args[0] === "cognitiveservices" && args[1] === "account" && args.includes("show")) {
		return { properties: { endpoints: { "AI Foundry API": "https://fixture-foundry.invalid" } } };
	}
	if (TEST_MODE && args[0] === "cognitiveservices" && args[1] === "account" && args[2] === "deployment" && args.includes("list")) {
		if (process.env.FUNCTION_CANVAS_TEST_EMPTY_MODELS === "1") return [];
		return [{ name: "fixture-model", properties: { provisioningState: "Succeeded", model: { name: "fixture-model" } } }];
	}
	try {
		const { stdout } = await runExternalCommandText("az", [...args, "--output", "json"], {
			env: safeEnvironment(),
			maxBuffer: 2 * 1024 * 1024,
			timeout: 30_000,
			windowsHide: true,
		});
		return JSON.parse(stdout);
	} catch (error) {
		throw new Error(`Azure CLI request failed: ${shortError(error)}`);
	}
}

async function subscriptions() {
	const rows = await azJson(["account", "list", "--all"]);
	return rows
		.filter((item) => item && item.state === "Enabled")
		.map((item) => ({ id: String(item.id || ""), name: String(item.name || ""), isDefault: Boolean(item.isDefault) }))
		.filter((item) => item.id)
		.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
}

async function functionApps(subscription) {
	if (!/^[0-9a-f-]{36}$/i.test(String(subscription))) throw new Error("Choose a valid Azure subscription ID.");
	const rows = await azJson([
		"resource",
		"list",
		"--subscription",
		subscription,
		"--resource-type",
		"Microsoft.Web/sites",
	]);
	return rows
		.filter((item) => String(item.kind || "").toLowerCase().includes("functionapp"))
		.map((item) => ({
			id: String(item.id || ""),
			name: String(item.name || ""),
			resourceGroup: String(item.resourceGroup || ""),
			location: String(item.location || ""),
			state: String(item.properties?.state || ""),
		}))
		.filter((item) => item.id)
		.sort((a, b) => a.name.localeCompare(b.name));
}

function page() {
	return renderPublicHostedSkillsHtml();
}

const servers = new Map();
function workspaceRelativePath(instanceId) {
	const identifier = String(instanceId || randomUUID());
	const suffix = identifier.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
	const digest = createHash("sha256").update(identifier).digest("hex").slice(0, 8);
	return `hosted-skill-${suffix || "instance"}-${digest}`;
}

function publicState(instanceId) {
	return {
		target: "local",
		sourceWorkspace: { mode: "current", workingDirectory: "", relativePath: workspaceRelativePath(instanceId), destination: "", materialized: false, operation: "", error: "", canUseCurrent: true, autoCreate: true },
		azure: { subscriptions: [], subscription: "", subscriptionsError: "" },
		modelBinding: { source: "foundry", subscription: "", foundry: [], gateways: [], resourceId: "", modelId: "", configured: false, activeSource: "", activeResourceId: "", activeModelId: "", activeLabel: "", loading: true, status: "Preparing Microsoft Foundry discovery...", error: "", readiness: { state: "discovering", message: "Preparing Microsoft Foundry discovery..." } },
		modelCreate: {
			planned: false,
			running: false,
			ok: null,
			message: "",
			resources: FOUNDRY_MODEL_CHOICES.map((choice) => ({
				kind: choice.deploymentName,
				note: `${choice.modelName} ${choice.modelVersion}, ${choice.skuName} capacity ${choice.capacity}`,
			})),
			alternatives: ["Already have a deployment? Return to Existing and select it."],
		},
		doctor: null,
		doctorRunning: false,
		local: { status: "stopped", port: 0, error: "", logTail: [], functions: [] },
		invocations: [],
	};
}

function snapshot(entry) {
	return structuredClone(entry.state);
}

function broadcast(entry) {
	const data = `event: state\ndata: ${JSON.stringify(snapshot(entry))}\n\n`;
	for (const response of entry.clients) response.write(data);
}

function reportError(entry, error, area = "local") {
	const message = shortError(error);
	if (area === "source") {
		entry.state.sourceWorkspace.operation = "";
		entry.state.sourceWorkspace.error = message;
	}
	else if (area === "model") entry.state.modelBinding.error = message;
	else entry.state.local.error = message;
	entry.state.local.logTail = [...entry.state.local.logTail, message].slice(-100);
	broadcast(entry);
	return { ok: false, message };
}
async function readJsonBody(request) {
	let body = "";
	for await (const chunk of request) {
		body += chunk;
		if (Buffer.byteLength(body) > 1_048_576) throw new Error("Request body is too large.");
	}
	if (!body) return {};
	const parsed = JSON.parse(body);
	if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Request body must be a JSON object.");
	return parsed;
}

function json(response, value, status = 200) {
	response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
	response.end(`${JSON.stringify(value)}\n`);
}

function sourceWorkspacePath(entry, relativePath = entry.state.sourceWorkspace.relativePath) {
	if (typeof relativePath !== "string" || !relativePath.trim() || path.isAbsolute(relativePath)) {
		throw new Error("Choose a relative local folder.");
	}
	const root = WORKSPACE_ROOT;
	const destination = path.resolve(root, relativePath);
	if (!destination.startsWith(`${root}${path.sep}`)) throw new Error("Choose a folder inside this extension workspace.");
	return destination;
}

async function hydrateOwnedWorkspace(entry) {
	const destination = sourceWorkspacePath(entry);
	try {
		await readFile(path.join(destination, OWNERSHIP_DIRECTORY, OWNERSHIP_FILE), "utf8");
		entry.workspacePath = destination;
		entry.state.sourceWorkspace.destination = destination;
		entry.state.sourceWorkspace.materialized = true;
		entry.state.sourceWorkspace.error = "";
		try {
			const metadata = JSON.parse(await readFile(path.join(destination, OWNERSHIP_DIRECTORY, MODEL_FILE), "utf8"));
			entry.persistedModel = metadata;
		} catch (error) {
			if (error?.code !== "ENOENT") throw error;
		}
	} catch (error) {
		if (error?.code !== "ENOENT") {
			entry.state.sourceWorkspace.error = `Could not reopen the local workspace: ${shortError(error)}`;
		}
	}
}

async function refreshFoundryModels(entry, generation = ++entry.modelGeneration) {
	const subscription = entry.state.modelBinding.subscription || entry.state.azure.subscription;
	if (!subscription) throw new Error("No enabled Azure subscription is available for model discovery.");
	const rows = await azJson([
		"resource",
		"list",
		"--subscription",
		subscription,
		"--resource-type",
		"Microsoft.CognitiveServices/accounts/projects",
	]);
	const accounts = [...new Map(rows.map((item) => {
		const parts = String(item.id || "").split("/");
		const accountIndex = parts.findIndex((part) => part.toLowerCase() === "accounts");
		const resourceGroup = String(item.resourceGroup || parts[4] || "");
		const accountName = String(parts[accountIndex + 1] || "");
		return [`${resourceGroup}/${accountName}`, { resourceGroup, accountName }];
	})).values()].filter(({ resourceGroup, accountName }) => resourceGroup && accountName);
	const details = await Promise.all(accounts.map(async ({ resourceGroup, accountName }) => {
		const [account, deployments] = await Promise.all([
			azJson(["cognitiveservices", "account", "show", "--subscription", subscription, "--resource-group", resourceGroup, "--name", accountName]),
			azJson(["cognitiveservices", "account", "deployment", "list", "--subscription", subscription, "--resource-group", resourceGroup, "--name", accountName]),
		]);
		return {
			key: `${resourceGroup}/${accountName}`,
			endpoint: String(account?.properties?.endpoints?.["AI Foundry API"] || "").replace(/\/+$/, ""),
			models: Array.isArray(deployments) ? deployments
				.filter((deployment) => deployment?.properties?.provisioningState === "Succeeded")
				.map((deployment) => ({ id: String(deployment.name || ""), label: String(deployment.properties?.model?.name || deployment.name || "") }))
				.filter((model) => model.id) : [],
		};
	}));
	const detailsByAccount = new Map(details.map((detail) => [detail.key, detail]));
	const discovered = rows
		.map((item) => {
			const id = String(item.id || "");
			const parts = id.split("/");
			const accountIndex = parts.findIndex((part) => part.toLowerCase() === "accounts");
			const resourceGroup = String(item.resourceGroup || parts[4] || "");
			const accountName = String(parts[accountIndex + 1] || "");
			const projectName = String(parts[accountIndex + 3] || item.name || "");
			const detail = detailsByAccount.get(`${resourceGroup}/${accountName}`);
			const endpoint = detail?.endpoint ? `${detail.endpoint}/api/projects/${encodeURIComponent(projectName)}` : "";
			const models = detail?.models || [];
			return {
				public: {
					id,
					label: projectName ? `${projectName} (${resourceGroup})` : String(item.name || ""),
					models,
				},
				privateResource: id && endpoint ? { id, endpoint, models } : null,
			};
		})
		.filter(({ public: resource, privateResource }) => resource.id && privateResource);
	if (generation !== entry.modelGeneration || subscription !== entry.state.modelBinding.subscription) return false;
	entry.modelResources.clear();
	for (const { privateResource } of discovered) {
		entry.modelResources.set(privateResource.id, { endpoint: privateResource.endpoint, models: privateResource.models });
	}
	const foundry = discovered.map(({ public: resource }) => resource);
	entry.state.modelBinding.foundry = foundry;
	if (!foundry.some((item) => item.id === entry.state.modelBinding.resourceId)) {
		entry.state.modelBinding.resourceId = foundry[0]?.id || "";
		entry.state.modelBinding.modelId = foundry[0]?.models[0]?.id || "";
		entry.state.modelBinding.configured = false;
		entry.state.modelBinding.activeSource = "";
		entry.state.modelBinding.activeResourceId = "";
		entry.state.modelBinding.activeModelId = "";
		entry.state.modelBinding.activeLabel = "";
	}
	const hasModels = foundry.some((item) => item.models.length);
	entry.state.modelBinding.status = !foundry.length
		? "No Microsoft Foundry projects with a public endpoint were found."
		: hasModels
			? "Select a Microsoft Foundry project and model."
			: "No deployed models were found. Use Create Models to add the supported deployments.";
	entry.state.modelBinding.readiness = {
		state: !foundry.length ? "no-account" : hasModels ? "select" : "no-model",
		message: entry.state.modelBinding.status,
	};
	const persisted = entry.persistedModel;
	if (persisted?.provider === "foundry") {
		const persistedResource = foundry.find((item) => entry.modelResources.get(item.id)?.endpoint === persisted.endpoint);
		const persistedModel = persistedResource?.models.find((item) => item.id === persisted.model);
		if (persistedResource && persistedModel) {
			entry.state.modelBinding.resourceId = persistedResource.id;
			entry.state.modelBinding.modelId = persistedModel.id;
			entry.state.modelBinding.configured = true;
			entry.state.modelBinding.activeSource = "foundry";
			entry.state.modelBinding.activeResourceId = persistedResource.id;
			entry.state.modelBinding.activeModelId = persistedModel.id;
			entry.state.modelBinding.activeLabel = `${persistedModel.label} via Microsoft Foundry`;
			entry.state.modelBinding.status = `${entry.state.modelBinding.activeLabel} is configured.`;
			entry.persistedModel = null;
		}
	}
	return true;
}

function selectedFoundryAccount(entry) {
				const id = String(entry.state.modelBinding.resourceId || entry.state.modelBinding.foundry[0]?.id || "");
				const parts = id.split("/");
				const accountIndex = parts.findIndex((part) => part.toLowerCase() === "accounts");
				const resourceGroupIndex = parts.findIndex((part) => part.toLowerCase() === "resourcegroups");
				const accountName = parts[accountIndex + 1] || "";
				const resourceGroup = parts[resourceGroupIndex + 1] || "";
				if (!id || !accountName || !resourceGroup) {
					throw new Error("Select a Microsoft Foundry project before creating model deployments.");
				}
				return { id, accountName, resourceGroup };
}

async function createFoundryModels(entry, input) {
				if (input.confirm !== true) throw new Error("Confirm the Azure model deployment before continuing.");
				if (entry.state.modelCreate.running) throw new Error("Model creation is already running.");
				const subscription = entry.state.modelBinding.subscription;
				if (!subscription) throw new Error("Select an Azure subscription before creating models.");
				const account = selectedFoundryAccount(entry);
				entry.state.modelCreate = { ...entry.state.modelCreate, planned: true, running: true, ok: null, message: "Creating supported Foundry model deployments..." };
				broadcast(entry);
				try {
					if (!TEST_MODE) {
						for (const choice of FOUNDRY_MODEL_CHOICES) {
							entry.state.modelCreate.message = `Creating ${choice.deploymentName} (${choice.modelName} ${choice.modelVersion})...`;
							entry.state.local.logTail = [...entry.state.local.logTail, `az cognitiveservices account deployment create --deployment-name ${choice.deploymentName} --model-name ${choice.modelName} --model-version ${choice.modelVersion} --sku-name ${choice.skuName} --sku-capacity ${choice.capacity}`].slice(-100);
							broadcast(entry);
							await runExternalCommandText("az", [
								"cognitiveservices", "account", "deployment", "create",
								"--subscription", subscription,
								"--resource-group", account.resourceGroup,
								"--name", account.accountName,
								"--deployment-name", choice.deploymentName,
								"--model-format", "OpenAI",
								"--model-name", choice.modelName,
								"--model-version", choice.modelVersion,
								"--sku-name", choice.skuName,
								"--sku-capacity", String(choice.capacity),
								"--output", "json",
							], { env: safeEnvironment(), maxBuffer: 2 * 1024 * 1024, timeout: 15 * 60_000, windowsHide: true });
							entry.state.local.logTail = [...entry.state.local.logTail, `${choice.deploymentName} deployment completed.`].slice(-100);
							broadcast(entry);
						}
					} else {
						const resource = entry.state.modelBinding.foundry.find((item) => item.id === account.id);
						resource.models = FOUNDRY_MODEL_CHOICES.map((choice) => ({ id: choice.deploymentName, label: choice.modelName }));
						const privateResource = entry.modelResources.get(account.id);
						if (privateResource) privateResource.models = resource.models;
					}
					const generation = ++entry.modelGeneration;
					if (!TEST_MODE) await refreshFoundryModels(entry, generation);
					const resource = entry.state.modelBinding.foundry.find((item) => item.id === account.id);
					const model = resource?.models.find((item) => item.id === "gpt-mini-latest") || resource?.models[0];
					if (!model) throw new Error("Azure reported success, but model discovery did not return the created deployment.");
					entry.state.modelBinding.resourceId = resource.id;
					entry.state.modelBinding.modelId = model.id;
					if (entry.workspacePath) await applySelectedFoundryModel(entry);
					entry.state.modelCreate = { ...entry.state.modelCreate, running: false, ok: true, message: `${model.label} is deployed and selected.` };
					broadcast(entry);
					return { ok: true, message: entry.state.modelCreate.message };
				} catch (error) {
					entry.state.modelCreate = { ...entry.state.modelCreate, running: false, ok: false, message: shortError(error) };
					broadcast(entry);
					throw error;
				}
}

async function initializePublicCanvas(entry) {
	if (entry.initializePromise) return entry.initializePromise;
	entry.initializePromise = (async () => {
		await hydrateOwnedWorkspace(entry);
		if (!entry.workspacePath && !entry.state.sourceWorkspace.error && entry.state.sourceWorkspace.autoCreate) {
			entry.state.sourceWorkspace.operation = "creating";
			broadcast(entry);
			try {
				entry.workspacePath = sourceWorkspacePath(entry);
				await createHostedSkill({ workspacePath: entry.workspacePath, confirm: true });
				entry.state.sourceWorkspace.destination = entry.workspacePath;
				entry.state.sourceWorkspace.materialized = true;
			} catch (error) {
				entry.workspacePath = "";
				entry.state.sourceWorkspace.error = `Could not create the bundled local workspace: ${shortError(error)}`;
			} finally {
				entry.state.sourceWorkspace.operation = "";
				broadcast(entry);
			}
		}
		entry.state.modelBinding.loading = true;
		entry.state.modelBinding.error = "";
		entry.state.modelBinding.status = "Discovering Microsoft Foundry projects...";
		entry.state.modelBinding.readiness = { state: "discovering", message: entry.state.modelBinding.status };
		broadcast(entry);
		try {
			const availableSubscriptions = await subscriptions();
			entry.state.azure.subscriptions = availableSubscriptions;
			const selected = availableSubscriptions.find((item) => item.isDefault) || availableSubscriptions[0];
			if (!selected) {
				entry.state.azure.subscriptionsError = "No enabled Azure subscriptions were found. Sign in with an account that can read a subscription, then refresh.";
				entry.state.modelBinding.status = "";
				entry.state.modelBinding.error = entry.state.azure.subscriptionsError;
				entry.state.modelBinding.readiness = { state: "no-subscription", message: entry.state.azure.subscriptionsError };
				return;
			}
			entry.state.azure.subscription = selected.id;
			entry.state.modelBinding.subscription = selected.id;
			await refreshFoundryModels(entry);
		} catch (error) {
			const message = `Model discovery failed: ${shortError(error)}`;
			entry.state.modelBinding.status = "";
			entry.state.modelBinding.error = message;
			entry.state.modelBinding.readiness = { state: "error", message };
		} finally {
			entry.state.modelBinding.loading = false;
			broadcast(entry);
		}
	})().finally(() => { entry.initializePromise = null; });
	return entry.initializePromise;
}

async function applySelectedFoundryModel(entry) {
	const binding = entry.state.modelBinding;
	const resource = binding.foundry.find((item) => item.id === binding.resourceId);
	const model = resource?.models.find((item) => item.id === binding.modelId);
	const privateResource = entry.modelResources.get(binding.resourceId);
	if (!resource || !model || !privateResource) throw new Error("Choose a discovered Microsoft Foundry project and model.");
	await configureHostedSkill({
		workspacePath: entry.workspacePath,
		provider: "foundry",
		endpoint: privateResource.endpoint,
		model: model.id,
		confirm: true,
	});
	binding.configured = true;
	binding.source = "foundry";
	binding.activeSource = "foundry";
	binding.activeResourceId = resource.id;
	binding.activeModelId = model.id;
	binding.activeLabel = `${model.label} via Microsoft Foundry`;
	binding.status = `${binding.activeLabel} is configured.`;
	if (entry.state.local.status === "stopped") {
		try {
			await startEntryLocalHost(entry);
		} catch {
			// Model configuration remains valid; local host diagnostics are in state.
		}
	}
}

async function startEntryLocalHost(entry) {
	if (!entry.workspacePath) throw new Error("Create a local workspace before starting it.");
	entry.state.local = { ...entry.state.local, status: "starting", error: "" };
	broadcast(entry);
	let result;
	try {
		result = await startLocalHostedSkill({
		workspacePath: entry.workspacePath,
		port: 7071,
		confirm: true,
		onOutput: (chunk) => {
			entry.state.local.logTail = [...entry.state.local.logTail, chunk].join("").slice(-12_000).split("\n").filter(Boolean).slice(-100);
			broadcast(entry);
		},
		onExit: ({ code, signal, output, detail }) => {
			const terminalError = entry.state.local.error || (code === 0 || signal === "SIGTERM" ? "" : detail);
			entry.state.local = {
				...entry.state.local,
				status: "stopped",
				port: 0,
				functions: [],
				logTail: output.split("\n").filter(Boolean).slice(-100),
				...(terminalError ? { error: terminalError } : {}),
			};
			broadcast(entry);
		},
		});
	} catch (error) {
		const message = shortError(error);
		entry.state.local = {
			...entry.state.local,
			status: "stopped",
			port: 0,
			error: entry.state.local.error || message,
			logTail: [...entry.state.local.logTail, message].slice(-100),
		};
		broadcast(entry);
		throw error;
	}
	entry.state.local = {
		...entry.state.local,
		status: "running",
		port: result.port,
		error: "",
		logTail: result.output ? [result.output] : [],
		functions: result.functions || [],
	};
	broadcast(entry);
	return result;
}

function handleUiRequest(entry, request, response) {
	if (request.method === "GET" && request.url === "/") {
		response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'" });
		response.end(page());
		return;
	}
	if (request.method === "GET" && request.url === "/events") {
		response.writeHead(200, {
			"content-type": "text/event-stream",
			"cache-control": "no-cache, no-transform",
			connection: "keep-alive",
		});
		entry.clients.add(response);
		response.write(`event: state\ndata: ${JSON.stringify(snapshot(entry))}\n\n`);
		request.once("close", () => entry.clients.delete(response));
		return;
	}
	const routes = new Map([
		["/doctor/run", async () => {
			entry.state.doctorRunning = true;
			broadcast(entry);
			const result = await doctorHostedSkill();
			const discovery = entry.state.modelBinding;
			const discoveryCheck = discovery.loading
				? { label: "Canvas initialization", status: "stale", detail: "Microsoft Foundry discovery is still running.", required: true }
				: discovery.error
					? { label: "Canvas initialization", status: "error", detail: discovery.error, required: true }
					: { label: "Canvas initialization", status: "ready", detail: "Microsoft Foundry discovery completed.", required: true };
			entry.state.doctor = {
				ready: result.ok && discoveryCheck.status === "ready",
				checks: result.checks.map((check) => ({
					label: check.id === "azure-cli" ? "Azure CLI" : "Azure Functions Core Tools",
					status: check.ok ? "ready" : "missing",
					detail: check.detail,
					required: true,
				})).concat(discoveryCheck),
			};
			entry.state.doctorRunning = false;
			broadcast(entry);
			return { ok: entry.state.doctor.ready, doctor: entry.state.doctor };
		}],
		["/source/create", async (body) => {
			entry.state.sourceWorkspace.operation = "creating";
			entry.state.sourceWorkspace.error = "";
			broadcast(entry);
			const workspacePath = sourceWorkspacePath(entry, body.relativePath);
			const result = await createHostedSkill({ workspacePath, confirm: true });
			entry.workspacePath = workspacePath;
			entry.state.sourceWorkspace.relativePath = String(body.relativePath || entry.state.sourceWorkspace.relativePath);
			entry.state.sourceWorkspace.destination = entry.workspacePath;
			entry.state.sourceWorkspace.materialized = true;
			entry.state.sourceWorkspace.operation = "";
			broadcast(entry);
			return result;
		}],
		["/models/select-subscription", async (body) => {
			if (!/^[0-9a-f-]{36}$/i.test(String(body.subscription))) throw new Error("Choose a valid Azure subscription ID.");
			if (!entry.state.azure.subscriptions.some((item) => item.id === body.subscription)) {
				throw new Error("Choose an enabled subscription returned by discovery.");
			}
			const generation = ++entry.modelGeneration;
			entry.state.modelBinding.subscription = body.subscription;
			entry.state.azure.subscription = body.subscription;
			entry.state.modelBinding.configured = false;
			entry.state.modelBinding.activeSource = "";
			entry.state.modelBinding.activeResourceId = "";
			entry.state.modelBinding.activeModelId = "";
			entry.state.modelBinding.activeLabel = "";
			entry.state.modelBinding.error = "";
			entry.state.modelBinding.loading = true;
			entry.state.modelBinding.status = "Discovering Microsoft Foundry projects...";
			broadcast(entry);
			try {
				await refreshFoundryModels(entry, generation);
				return { ok: true };
			} finally {
				if (generation === entry.modelGeneration && entry.state.modelBinding.subscription === body.subscription) {
					entry.state.modelBinding.loading = false;
					broadcast(entry);
				}
			}
		}],
		["/models/select-source", async (body) => {
			if (body.source !== "foundry") throw new Error("Only Microsoft Foundry models are available in this extension.");
			entry.state.modelBinding.source = "foundry";
			entry.state.modelBinding.configured = false;
			entry.state.modelBinding.activeSource = "";
			entry.state.modelBinding.activeResourceId = "";
			entry.state.modelBinding.activeModelId = "";
			entry.state.modelBinding.activeLabel = "";
			entry.state.modelBinding.error = "";
			broadcast(entry);
			return { ok: true };
		}],
		["/models/select-choice", async (body) => {
			entry.state.modelBinding.resourceId = String(body.resourceId || "");
			entry.state.modelBinding.modelId = String(body.modelId || "");
			entry.state.modelBinding.configured = false;
			entry.state.modelBinding.activeSource = "";
			entry.state.modelBinding.activeResourceId = "";
			entry.state.modelBinding.activeModelId = "";
			entry.state.modelBinding.activeLabel = "";
			entry.state.modelBinding.error = "";
			await applySelectedFoundryModel(entry);
			broadcast(entry);
			return { ok: true };
		}],
		["/models/refresh", async () => {
			const generation = ++entry.modelGeneration;
			const subscription = entry.state.modelBinding.subscription;
			entry.state.modelBinding.loading = true;
			entry.state.modelBinding.error = "";
			broadcast(entry);
			try {
				await refreshFoundryModels(entry, generation);
				return { ok: true };
			} finally {
				if (generation === entry.modelGeneration && subscription === entry.state.modelBinding.subscription) {
					entry.state.modelBinding.loading = false;
					broadcast(entry);
				}
			}
		}],
		["/models/create-plan", async () => {
			selectedFoundryAccount(entry);
			entry.state.modelCreate = { ...entry.state.modelCreate, planned: true, message: "Review the two supported deployments, then confirm the Azure change." };
			broadcast(entry);
			return { ok: true };
		}],
		["/models/create", async (body) => createFoundryModels(entry, body)],
		["/models/apply", async (body) => {
			if (body.source !== "foundry") throw new Error("Only Microsoft Foundry models are available in this extension.");
			entry.state.modelBinding.resourceId = String(body.resourceId || "");
			entry.state.modelBinding.modelId = String(body.modelId || "");
			if (!entry.workspacePath) throw new Error("Create a local workspace before configuring a model.");
			await applySelectedFoundryModel(entry);
			broadcast(entry);
			return { ok: true };
		}],
		["/open-vscode", async () => ({
			...await openHostedSkillInVsCode({ workspacePath: entry.workspacePath, confirm: true }),
			...(TEST_MODE ? { message: "Opened the local workspace in VS Code." } : {}),
		})],
		["/edit-instructions-vscode", async () => ({
			...await editHostedSkillInstructions({ workspacePath: entry.workspacePath, confirm: true }),
			...(TEST_MODE ? { message: "Opened the hosted-skill instructions in VS Code." } : {}),
		})],
		["/local/start", async () => {
			return startEntryLocalHost(entry);
		}],
		["/local/stop", async () => {
			const result = await stopLocalHostedSkill({ workspacePath: entry.workspacePath, confirm: true });
			entry.state.local = { ...entry.state.local, status: "stopped", port: 0 };
			broadcast(entry);
			return result;
		}],
		["/invoke", async (body) => {
			if (!entry.workspacePath) throw new Error("Create a local workspace before invoking it.");
			const result = await invokeLocalHostedSkill({ workspacePath: entry.workspacePath, prompt: body.prompt, confirm: true });
			entry.state.invocations.push({ ok: result.ok, note: result.ok ? "Local invocation completed." : `Invocation failed (${result.status}).`, response: result.response });
			entry.state.local.logTail = result.commandOutput ? [result.commandOutput] : entry.state.local.logTail;
			broadcast(entry);
			return { ok: result.ok, result };
		}],
		["/deployment/prepare", async () => prepareFoundryDeployment({ workspacePath: entry.workspacePath, confirm: true })],
		["/clear", async () => {
			entry.state.invocations = [];
			broadcast(entry);
			return { ok: true };
		}],
	]);
	const handler = request.method === "POST" ? routes.get(request.url) : undefined;
	if (!handler) return json(response, { ok: false, message: "Route not found." }, 404);
	readJsonBody(request)
		.then((body) => handler(body))
		.then((result) => json(response, result))
		.catch((error) => json(response, reportError(entry, error, request.url.startsWith("/source/") ? "source" : request.url.startsWith("/models/") ? "model" : "local"), 400));
}

async function openPage(instanceId) {
	let server = servers.get(instanceId);
	if (!server) {
		server = {
			clients: new Set(),
			state: publicState(instanceId),
			workspacePath: "",
			modelResources: new Map(),
			modelGeneration: 0,
			persistedModel: null,
			server: null,
		};
		server.server = createServer((request, response) => handleUiRequest(server, request, response));
		await new Promise((resolve, reject) => {
			server.server.once("error", reject);
			server.server.listen(0, "127.0.0.1", resolve);
		});
		servers.set(instanceId, server);
		void initializePublicCanvas(server);
	}
	const address = server.server.address();
	return { url: `http://127.0.0.1:${address.port}/`, title: DISPLAY_NAME, status: "Ready." };
}

async function closeEntry(instanceId) {
	const server = servers.get(instanceId);
	if (!server) return;
	servers.delete(instanceId);
	if (server.workspacePath) await closeLocalHost(server.workspacePath);
	for (const client of server.clients) client.end();
	await new Promise((resolve) => server.server.close(resolve));
	if (server.workspacePath) await closeLocalHost(server.workspacePath);
}

let shuttingDown = false;
async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;
	await Promise.allSettled([...servers.keys()].map(closeEntry));
	await Promise.allSettled([...localHosts.entries()].map(([workspacePath, state]) => closeLocalHost(workspacePath, state)));
}

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.once(signal, () => {
		void shutdown().finally(() => process.exit(0));
	});
}

const canvas = createCanvas({
	id: "azure-functions-hosted-skills-preview-9",
	displayName: DISPLAY_NAME,
	description: "Read-only discovery of Azure Function Apps for Hosted Skills work.",
	actions: [
		{
			name: "list_azure_subscriptions",
			description: "List enabled Azure subscriptions available through the signed-in Azure CLI. This is read-only.",
			inputSchema: { type: "object", properties: {}, additionalProperties: false },
			async handler() {
				try {
					return { ok: true, subscriptions: await subscriptions() };
				} catch (error) {
					return { ok: false, message: shortError(error) };
				}
			},
		},
		{
			name: "list_function_apps",
			description: "List Azure Function Apps in one subscription. This is read-only and does not invoke functions.",
			inputSchema: {
				type: "object",
				properties: { subscription: { type: "string", description: "Azure subscription ID." } },
				required: ["subscription"],
				additionalProperties: false,
			},
			async handler({ input }) {
				try {
					return { ok: true, apps: await functionApps(input.subscription) };
				} catch (error) {
					return { ok: false, message: shortError(error) };
				}
			},
		},
		{
			name: "doctor_hosted_skill",
			description: "Check Azure CLI sign-in and Azure Functions Core Tools availability without changing your environment.",
			inputSchema: { type: "object", properties: {}, additionalProperties: false },
			async handler() {
				return doctorHostedSkill();
			},
		},
		...(process.env.ALLOW_WRITES === "true" ? [
			{
				name: "create_hosted_skill",
				description: "Create a new local workspace from the bundled starter. Requires confirmation and never overwrites an existing path.",
				inputSchema: {
					type: "object",
					properties: {
						workspacePath: { type: "string", description: "Absolute path for a new local workspace." },
						confirm: { type: "boolean", description: "Confirm creation of this local workspace." },
					},
					required: ["workspacePath", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try {
						return await createHostedSkill(input);
					} catch (error) {
						return { ok: false, message: shortError(error) };
					}
				},
			},
			{
				name: "configure_hosted_skill",
				description: "Save non-secret model metadata in a workspace created by this canvas. Requires confirmation.",
				inputSchema: {
					type: "object",
					properties: {
						workspacePath: { type: "string", description: "Absolute path of the created workspace." },
						provider: { type: "string", enum: ["foundry"] },
						model: { type: "string", description: "Selected model or deployment name." },
						endpoint: { type: "string", description: "Optional HTTPS model endpoint, without credentials." },
						managedIdentityClientId: { type: "string", description: "Optional managed identity client ID." },
						confirm: { type: "boolean", description: "Confirm saving this local configuration." },
					},
					required: ["workspacePath", "provider", "model", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try {
						return await configureHostedSkill(input);
					} catch (error) {
						return { ok: false, message: shortError(error) };
					}
				},
			},
			{
				name: "open_hosted_skill_in_vscode",
				description: "Open an owned workspace in VS Code after confirmation.",
				inputSchema: {
					type: "object",
					properties: { workspacePath: { type: "string" }, confirm: { type: "boolean" } },
					required: ["workspacePath", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try { return await openHostedSkillInVsCode(input); } catch (error) { return { ok: false, message: shortError(error) }; }
				},
			},
			{
				name: "edit_hosted_skill_instructions",
				description: "Open the owned hosted skill instructions in VS Code.",
				inputSchema: {
					type: "object",
					properties: { workspacePath: { type: "string" }, confirm: { type: "boolean" } },
					required: ["workspacePath"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try { return await editHostedSkillInstructions(input); } catch (error) { return { ok: false, message: shortError(error) }; }
				},
			},
			{
				name: "start_local_hosted_skill",
				description: "Start Azure Functions Core Tools for an owned workspace after confirmation.",
				inputSchema: {
					type: "object",
					properties: {
						workspacePath: { type: "string" },
						port: { type: "integer", minimum: 1024, maximum: 65535 },
						confirm: { type: "boolean" },
					},
					required: ["workspacePath", "port", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try { return await startLocalHostedSkill(input); } catch (error) { return { ok: false, message: shortError(error) }; }
				},
			},
			{
				name: "stop_local_hosted_skill",
				description: "Stop Azure Functions Core Tools for an owned workspace after confirmation.",
				inputSchema: {
					type: "object",
					properties: { workspacePath: { type: "string" }, confirm: { type: "boolean" } },
					required: ["workspacePath", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try { return await stopLocalHostedSkill(input); } catch (error) { return { ok: false, message: shortError(error) }; }
				},
			},
			{
				name: "invoke_local_hosted_skill",
				description: "Invoke the owned local hosted skill and return the function command output and agent response.",
				inputSchema: {
					type: "object",
					properties: { workspacePath: { type: "string" }, prompt: { type: "string" }, confirm: { type: "boolean" } },
					required: ["workspacePath", "prompt", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try { return await invokeLocalHostedSkill(input); } catch (error) { return { ok: false, message: shortError(error) }; }
				},
			},
			{
				name: "prepare_foundry_deployment",
				description: "Check that an owned workspace has safe Foundry metadata before Azure deployment preparation.",
				inputSchema: {
					type: "object",
					properties: { workspacePath: { type: "string" }, confirm: { type: "boolean" } },
					required: ["workspacePath", "confirm"],
					additionalProperties: false,
				},
				async handler({ input }) {
					try { return await prepareFoundryDeployment(input); } catch (error) { return { ok: false, message: shortError(error) }; }
				},
			},
		] : []),
	],
	open({ instanceId }) {
		return openPage(instanceId);
	},
	async onClose({ instanceId }) {
		await closeEntry(instanceId);
	},
});

await joinSession({ canvases: [canvas] });
