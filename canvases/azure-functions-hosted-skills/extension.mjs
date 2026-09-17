import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cp, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";

const execute = promisify(execFile);
const DISPLAY_NAME = "Azure Functions Hosted Skills";
const ARM_API_VERSION = "2024-04-01";
const TEMPLATE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "templates", "hosted-skill");
const OWNERSHIP_DIRECTORY = ".azure-functions-hosted-skills";
const OWNERSHIP_FILE = "ownership.json";
const MODEL_FILE = "model.json";
const LOCAL_SETTINGS_FILE = "local.settings.json";
const localHosts = new Map();

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

function assertWritesEnabled() {
	if (process.env.ALLOW_WRITES !== "true") throw new Error("This action requires ALLOW_WRITES=true when the canvas is started.");
}

function assertConfirmed(input) {
	if (input.confirm !== true) throw new Error("Confirm this workspace change before continuing.");
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
	assertWritesEnabled();
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
	assertWritesEnabled();
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
	assertWritesEnabled();
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const port = validPort(input.port);
	if (localHosts.has(workspacePath)) throw new Error("This workspace already has a local function host.");
	const child = spawn("func", ["start", "--port", String(port)], {
		cwd: path.join(workspacePath, "src"),
		env: safeEnvironment(),
		stdio: ["ignore", "pipe", "pipe"],
		windowsHide: true,
	});
	const state = { child, port, output: "" };
	const append = (chunk) => { state.output = `${state.output}${String(chunk)}`.slice(-12_000); };
	child.stdout.on("data", append);
	child.stderr.on("data", append);
	child.once("error", (error) => { append(`Unable to start Azure Functions Core Tools: ${shortError(error)}`); });
	child.once("close", (code, signal) => {
		append(`Function host stopped (${signal || `exit ${code ?? "unknown"}`}).`);
		localHosts.delete(workspacePath);
	});
	localHosts.set(workspacePath, state);
	return { ok: true, workspacePath, port, output: state.output };
}

async function invokeLocalHostedSkill(input) {
	assertWritesEnabled();
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
	assertWritesEnabled();
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
	assertWritesEnabled();
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	try {
		await execute("code", [workspacePath], { env: safeEnvironment(), timeout: 30_000, windowsHide: true });
		return { ok: true, workspacePath };
	} catch (error) {
		throw new Error(`Could not open VS Code: ${shortError(error)}`);
	}
}

async function stopLocalHostedSkill(input) {
	assertWritesEnabled();
	assertConfirmed(input);
	const workspacePath = await assertOwnedWorkspace(input.workspacePath);
	const state = localHosts.get(workspacePath);
	if (!state) throw new Error("This workspace does not have a local function host.");
	state.child.kill("SIGTERM");
	return { ok: true, workspacePath };
}

async function azJson(args) {
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

function page(writesEnabled) {
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${DISPLAY_NAME}</title><style>
body{font:14px system-ui,sans-serif;line-height:1.5;margin:0;color:var(--text-color-default,#1f2937);background:var(--background-color-default,#fff)}main{padding:1.5rem;margin:auto;max-width:56rem}h1{font-size:1.5rem;margin:0}h2{font-size:1rem;margin:0}.lead{color:var(--text-color-muted,#57606a)}.card{border:1px solid var(--border-color-default,#d0d7de);border-radius:10px;padding:1rem;margin-top:1rem}.grid{display:grid;gap:.7rem;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))}label{display:grid;gap:.25rem;font-weight:600}input,textarea,button{font:inherit;padding:.45rem;border:1px solid var(--border-color-default,#8c959f);border-radius:6px;background:var(--background-color-default,#fff);color:inherit}textarea{min-height:5rem}button{cursor:pointer;font-weight:600}.row{display:flex;gap:.5rem;flex-wrap:wrap}.notice{font-weight:600}.error{color:#cf222e}.success{color:#1a7f37}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f6f8fa;padding:.75rem;border-radius:6px;max-height:18rem;overflow:auto}
</style></head><body><main><h1>${DISPLAY_NAME}</h1><p class="lead">Create a local Microsoft Foundry hosted skill, run it locally, and inspect function output and its response.</p><div class="card"><div class="row"><button id="doctor" type="button">Doctor</button><button id="subscriptions" type="button">List subscriptions</button></div><div id="status" class="notice" role="status">Ready.</div><pre id="result" hidden></pre></div>${writesEnabled ? `<div class="card"><h2>Local workspace</h2><div class="grid"><label>New workspace path<input id="workspace-path" autocomplete="off"></label><label>Foundry endpoint<input id="foundry-endpoint" autocomplete="off"></label><label>Model deployment<input id="foundry-model" autocomplete="off"></label><label>Managed identity client ID (optional)<input id="managed-identity-client-id" autocomplete="off"></label></div><div class="row"><button id="create" type="button">Create workspace</button><button id="configure" type="button">Configure model</button><button id="open-vscode" type="button">Open in VS Code</button></div></div><div class="card"><h2>Local invocation</h2><div class="grid"><label>Port<input id="local-port" type="number" value="7071" min="1024" max="65535"></label><label>Prompt<textarea id="prompt">Describe the current task in one sentence.</textarea></label></div><div class="row"><button id="start-local" type="button">Start local function</button><button id="stop-local" type="button">Stop local function</button><button id="invoke-local" type="button">Invoke</button><button id="prepare-deployment" type="button">Prepare deployment</button></div><h2>Command output</h2><pre id="command-output">No local host output yet.</pre><h2>Agent response</h2><pre id="agent-response">No invocation response yet.</pre></div>` : `<div class="card" id="read-only-notice">This canvas is read-only. Local workspace controls require explicit write enablement when the extension starts.</div>`}<script>const $=id=>document.getElementById(id),writes=${JSON.stringify(writesEnabled)};function setStatus(message,ok){const el=$("status");el.textContent=message||"Ready.";el.className="notice "+(ok===false?"error":ok===true?"success":"")}function value(id){return $(id)?.value?.trim()||""}async function post(route,body={}){setStatus("Working...");try{const response=await fetch(route,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),result=await response.json();if(!result.ok)throw new Error(result.message||"Request failed.");setStatus(result.message||"Completed.",true);return result}catch(error){setStatus(error.message||String(error),false);throw error}}$("doctor").onclick=async()=>{try{const result=await post("/doctor");$("result").hidden=false;$("result").textContent=JSON.stringify(result.checks,null,2)}catch{}};$("subscriptions").onclick=async()=>{try{const result=await post("/subscriptions");$("result").hidden=false;$("result").textContent=JSON.stringify(result.subscriptions,null,2)}catch{}};if(writes){const input=()=>({workspacePath:value("workspace-path")}),write=async(route,body,label)=>{if(window.confirm(label))return post(route,{...body,confirm:true})};$("create").onclick=async()=>{try{await write("/workspace/create",input(),"Create this new local workspace?")}catch{}};$("configure").onclick=async()=>{try{await write("/workspace/configure",{...input(),provider:"foundry",endpoint:value("foundry-endpoint"),model:value("foundry-model"),managedIdentityClientId:value("managed-identity-client-id")},"Save this model configuration in the selected workspace?")}catch{}};$("open-vscode").onclick=async()=>{try{await write("/workspace/open-vscode",input(),"Open this workspace in VS Code?")}catch{}};$("start-local").onclick=async()=>{try{const result=await write("/local/start",{...input(),port:Number(value("local-port"))},"Start the local function host?");if(result)$("command-output").textContent=result.output||"Local host started."}catch{}};$("stop-local").onclick=async()=>{try{await write("/local/stop",input(),"Stop the local function host?")}catch{}};$("invoke-local").onclick=async()=>{try{const result=await write("/local/invoke",{workspacePath:value("workspace-path"),prompt:value("prompt")},"Invoke this local hosted skill?");if(result){$("command-output").textContent=result.commandOutput||"";$("agent-response").textContent=result.response||""}}catch{}};$("prepare-deployment").onclick=async()=>{try{const result=await write("/deployment/prepare",input(),"Check this workspace before deployment?");if(result)$("command-output").textContent=result.message||""}catch{}}}</script></main></body></html>`;
}

const servers = new Map();
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

function handleUiRequest(request, response, writesEnabled) {
	if (request.method === "GET" && request.url === "/") {
		response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'" });
		response.end(page(writesEnabled));
		return;
	}
	const routes = new Map([
		["/doctor", () => doctorHostedSkill()],
		["/subscriptions", async () => ({ ok: true, subscriptions: await subscriptions() })],
		["/workspace/create", createHostedSkill],
		["/workspace/configure", configureHostedSkill],
		["/workspace/open-vscode", openHostedSkillInVsCode],
		["/local/start", startLocalHostedSkill],
		["/local/stop", stopLocalHostedSkill],
		["/local/invoke", invokeLocalHostedSkill],
		["/deployment/prepare", prepareFoundryDeployment],
	]);
	const handler = request.method === "POST" ? routes.get(request.url) : undefined;
	if (!handler) return json(response, { ok: false, message: "Route not found." }, 404);
	readJsonBody(request).then((body) => handler(body)).then((result) => json(response, result)).catch((error) => json(response, { ok: false, message: shortError(error) }, 400));
}

async function openPage(instanceId) {
	let server = servers.get(instanceId);
	if (!server) {
		const writesEnabled = process.env.ALLOW_WRITES === "true";
		server = createServer((request, response) => handleUiRequest(request, response, writesEnabled));
		await new Promise((resolve, reject) => {
			server.once("error", reject);
			server.listen(0, "127.0.0.1", resolve);
		});
		servers.set(instanceId, server);
	}
	const address = server.address();
	return { url: `http://127.0.0.1:${address.port}/`, title: DISPLAY_NAME, status: process.env.ALLOW_WRITES === "true" ? "Ready." : "Ready (read-only)." };
}

const canvas = createCanvas({
	id: "azure-functions-hosted-skills",
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
		await new Promise((resolve) => server.close(resolve));
	},
});

await joinSession({ canvases: [canvas] });
