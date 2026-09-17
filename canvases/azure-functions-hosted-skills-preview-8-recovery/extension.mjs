import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { cp, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { renderPublicHostedSkillsHtml } from "./canonical-renderer.mjs";

const execute = promisify(execFile);
const DISPLAY_NAME = "Azure Functions Hosted Skills (preview-8-recovery)";
const ARM_API_VERSION = "2024-04-01";
const TEMPLATE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "templates", "hosted-skill");
const OWNERSHIP_DIRECTORY = ".azure-functions-hosted-skills-preview-8-recovery";
const OWNERSHIP_FILE = "ownership.json";
const MODEL_FILE = "model.json";
const LOCAL_SETTINGS_FILE = "local.settings.json";
const localHosts = new Map();
const TEST_MODE = process.env.FUNCTION_CANVAS_TEST_MODE === "1";
const WORKSPACE_ROOT = path.resolve(process.env.FUNCTION_CANVAS_WORKSPACE_ROOT || path.join(homedir(), "AzureFunctionsHostedSkills"));
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
	const localSettings = {
		IsEncrypted: false,
		Values: {
			FUNCTIONS_WORKER_RUNTIME: "python",
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

async function startLocalHostedSkill(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const port = validPort(input.port);
	if (localHosts.has(workspacePath)) throw new Error("This workspace already has a local function host.");
	if (TEST_MODE) {
		const child = new EventEmitter();
		let server;
		child.kill = () => {
			server?.close(() => child.emit("close", 0, "SIGTERM"));
			return true;
		};
		server = createServer((request, response) => {
			if (request.method === "POST" && request.url === "/agents/daily_repo_digest_http/chat") {
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
		return { ok: true, workspacePath, port: mockPort, output: state.output };
	}
	const child = spawn("func", ["start", "--port", String(port)], {
		cwd: path.join(workspacePath, "src"),
		env: safeEnvironment(),
		stdio: ["ignore", "pipe", "pipe"],
		windowsHide: true,
	});
	const state = { child, port, output: "" };
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
		localHosts.delete(workspacePath);
		input.onExit?.({ code, signal, output: state.output, detail });
		if (code !== 0 && signal !== "SIGTERM") failed(new Error(`${detail} ${state.output}`));
	});
	localHosts.set(workspacePath, state);
	if (launchError) throw new Error(`Unable to start Azure Functions Core Tools: ${shortError(launchError)}`);
	await Promise.race([
		readyPromise,
		new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out waiting for Azure Functions Core Tools to start. ${state.output}`)), 30_000)),
	]);
	return { ok: true, workspacePath, port, output: state.output };
}

async function invokeLocalHostedSkill(input) {
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const state = localHosts.get(workspacePath);
	if (!state) throw new Error("Start the local function host for this workspace first.");
	const prompt = String(input.prompt || "").trim();
	if (!prompt) throw new Error("Enter a prompt to invoke the hosted skill.");
	const response = await fetch(`http://127.0.0.1:${state.port}/agents/daily_repo_digest_http/chat`, {
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
		execute("az", ["account", "show", "--output", "json"], { env: safeEnvironment(), timeout: 30_000 })
			.then(() => ({ id: "azure-cli", ok: true, detail: "Signed in Azure CLI is available." }))
			.catch((error) => ({ id: "azure-cli", ok: false, detail: shortError(error) })),
		execute("func", ["--version"], { env: safeEnvironment(), timeout: 30_000 })
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
		await execute("code", [workspacePath], { env: safeEnvironment(), timeout: 30_000, windowsHide: true });
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
		await execute("code", [workspacePath, "--goto", filePath], { env: safeEnvironment(), timeout: 30_000, windowsHide: true });
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
	state.child.kill("SIGTERM");
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
		const { stdout } = await execute("az", [...args, "--output", "json"], {
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
function publicState() {
	return {
		target: "local",
		sourceWorkspace: { mode: "current", workingDirectory: "", relativePath: "hosted-skill", destination: "", materialized: false, operation: "", error: "", canUseCurrent: true, autoCreate: true },
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
							await execute("az", [
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
			entry.workspacePath = sourceWorkspacePath(entry, body.relativePath);
			const result = await createHostedSkill({ workspacePath: entry.workspacePath, confirm: true });
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
			if (!entry.workspacePath) throw new Error("Create a local workspace before starting it.");
			entry.state.local = { ...entry.state.local, status: "starting", error: "" };
			broadcast(entry);
			const result = await startLocalHostedSkill({
				workspacePath: entry.workspacePath,
				port: 7071,
				confirm: true,
				onOutput: (chunk) => {
					entry.state.local.logTail = [...entry.state.local.logTail, chunk].join("").slice(-12_000).split("\n").filter(Boolean).slice(-100);
					broadcast(entry);
				},
				onExit: ({ code, signal, output, detail }) => {
					entry.state.local = {
						...entry.state.local,
						status: "stopped",
						port: 0,
						logTail: output.split("\n").filter(Boolean).slice(-100),
						...(code === 0 || signal === "SIGTERM" ? {} : { error: detail }),
					};
					broadcast(entry);
				},
			});
			entry.state.local = { ...entry.state.local, status: "running", port: result.port, error: "", logTail: result.output ? [result.output] : [] };
			const host = localHosts.get(entry.workspacePath);
			host?.child.once("error", (error) => {
				entry.state.local = {
					...entry.state.local,
					status: "stopped",
					port: 0,
					error: `Unable to start local function host: ${shortError(error)}`,
					logTail: [...entry.state.local.logTail, shortError(error)].slice(-100),
				};
				broadcast(entry);
			});
			host?.child.once("close", (code, signal) => {
				entry.state.local = {
					...entry.state.local,
					status: "stopped",
					port: 0,
					...(code === 0 || signal === "SIGTERM" ? {} : { error: `Local function host exited (${signal || `code ${code ?? "unknown"}`}).` }),
				};
				broadcast(entry);
			});
			broadcast(entry);
			return result;
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
			state: publicState(),
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

const canvas = createCanvas({
	id: "azure-functions-hosted-skills-preview-8-recovery",
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
		const server = servers.get(instanceId);
		if (!server) return;
		servers.delete(instanceId);
		for (const client of server.clients) client.end();
		await new Promise((resolve) => server.server.close(resolve));
	},
});

await joinSession({ canvases: [canvas] });
