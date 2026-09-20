// studio-commands.mjs
//
// Shared four-command surface for every Cloud Foundation canvas: Run (canvas
// specific), Open in VS Code, Save to GitHub, and Deploy to Azure. This file is
// the single source of truth in scripts/lib and is vendored byte-identical into
// each canvas directory so a canvas stays independently installable (only its
// own directory ships when the plugin is installed). scripts/validate.mjs
// asserts every vendored copy matches this source.
//
// The command mechanics here are canvas-agnostic. Each canvas supplies its own
// materialize step (which files to write) and state snapshot; the helper owns
// the git/gh/azd/vscode process work, the shared button icons and CSS, and the
// client-side wiring.

import { execFile, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, readFileSync } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// LOCAL means a loopback canvas or func start. CLOUD means deployed to Azure Functions via azd.
export const RUNTIME_MODE = { LOCAL: "local", CLOUD: "cloud" };

export const AZD_DOCS_URL = "https://learn.microsoft.com/azure/developer/azure-developer-cli/";

export function resolveStudioBuildInfo(moduleUrl, fallbackVersion = "unknown") {
	let version = fallbackVersion;
	let revision = "unknown";
	try {
		version = JSON.parse(readFileSync(new URL("./package.json", moduleUrl), "utf8")).version || fallbackVersion;
	} catch {
		// Keep the footer available in a partially packaged development copy.
	}
	try {
		revision = createHash("sha256").update(readFileSync(new URL(moduleUrl))).digest("hex").slice(0, 10);
	} catch {
		// A stable fallback is clearer than preventing the canvas from opening.
	}
	return { version, revision };
}

// Product icons (VS Code, GitHub, Azure) as inline SVG so buttons render without assets.
export const ICONS = {
	vscode:
		'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>',
	github:
		'<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
	azure:
		'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.05 2 4 20.01h5.86l1.45-3.73 5.63 5.72H24L13.05 2Zm.8 6.42 4.37 10.36-5.25-4.79 2.91-5.01-2.03-.56ZM10.1 17.73H6.78l5.45-10.85 1.43 3.38-3.56 7.47Z"/></svg>',
};

// The three portable command buttons. The canvas supplies its own primary Run button.
export const COMMAND_BUTTONS = `<button class="btn ghost" id="open-vscode">${ICONS.vscode}<span class="label">Open in VS Code</span></button>
      <button class="btn ghost" id="save-github">${ICONS.github}<span class="label">Save to GitHub</span></button>
      <button class="btn ghost" id="deploy-azure">${ICONS.azure}<span class="label">Deploy to Azure</span></button>`;

// Shared CSS for the command buttons, deploy status panel, and mode badge.
// Canvases define their own --accent / --line / --ink / --muted / --panel palette.
export const COMMAND_CSS = `.btn {
    border: none; cursor: pointer; border-radius: 10px; padding: 10px 16px;
    font-size: .86rem; font-weight: 600; color: #0b1120;
    background: linear-gradient(135deg, var(--accent), #ffcf6b);
    display: inline-flex; align-items: center; gap: .45rem;
  }
  .btn svg { width: 15px; height: 15px; flex: 0 0 auto; }
  .btn:hover { filter: brightness(1.05); }
  .btn.ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
  .btn.ghost:hover { color: var(--ink); }
  .mode-badge {
    display: inline-block; font-size: .72rem; color: var(--muted); border: 1px solid var(--line);
    border-radius: 999px; padding: 3px 10px; background: var(--panel);
  }
  .deploy-status {
    display: none; color: var(--muted); font-size: .78rem; line-height: 1.45;
    margin: -.35rem 0 1rem; padding: .65rem .75rem; border: 1px solid var(--line);
    border-radius: 10px; background: rgba(255,255,255,.03); overflow-wrap: anywhere;
  }
  .deploy-status.show { display: block; }
  .deploy-status strong { color: var(--ink); }
  .deploy-status a { color: var(--accent2); text-decoration: none; }
  .deploy-status a:hover { text-decoration: underline; }`;

// Client-side wiring for the three command buttons plus the deploy-status and
// mode-badge elements. The canvas provides window.cmdSetStatus(message, url) and
// calls window.applyCommandState(state) from its own EventSource state handler.
export function commandClientScript() {
	return `
    (function () {
      function postJson(url) { return fetch(url, { method: 'POST' }).then(function (r) { return r.json(); }); }
      var openVscode = document.getElementById('open-vscode');
      var saveGithub = document.getElementById('save-github');
      var deployAzure = document.getElementById('deploy-azure');
      var deployStatus = document.getElementById('deploy-status');
      var modeBadge = document.getElementById('mode-badge');
      function status(message, url) {
        if (typeof window.cmdSetStatus === 'function') window.cmdSetStatus(message, url);
      }
      window.applyCommandState = function (state) {
        if (modeBadge) {
          var cloud = state.runtimeMode === 'cloud';
          modeBadge.textContent = cloud ? 'Mode: Cloud (Azure Functions)' : 'Mode: Local';
        }
        if (saveGithub) {
          var lbl = saveGithub.querySelector('.label');
          if (lbl) lbl.textContent = state.repoUrl ? 'Open on GitHub' : 'Save to GitHub';
        }
        if (deployStatus) {
          if (state.deployStatus) {
            deployStatus.classList.add('show');
            deployStatus.innerHTML = '<strong>Deploy:</strong> ' + state.deployStatus;
            if (state.deployDocsUrl) deployStatus.innerHTML += ' <a href="' + state.deployDocsUrl + '" target="_blank" rel="noreferrer">Install azd</a>';
            if (state.deployCommand) deployStatus.innerHTML += '<br /><code>' + state.deployCommand + '</code>';
          } else {
            deployStatus.classList.remove('show');
            deployStatus.textContent = '';
          }
        }
        if (deployAzure) {
          // state.azdOperation is only present on canvases with a second azd
          // write path to guard against (e.g. Create Models' azd provision);
          // canvases without one simply never set it, so this is a no-op there.
          var azdOp = state.azdOperation;
          var blocked = Boolean(azdOp && azdOp.active);
          var deploying = Boolean(blocked && azdOp.kind === 'deploy');
          deployAzure.disabled = blocked;
          var deployLabel = deployAzure.querySelector('.label');
          if (deployLabel) deployLabel.textContent = deploying ? 'Deploying...' : (deployAzure.dataset.label || 'Deploy to Azure');
          deployAzure.title = blocked
            ? deploying
              ? 'Deployment is running. Expand Deployment output to follow progress or cancel it.'
              : (azdOp.label || 'Another azd operation') + ' is still running for this working copy - wait for it to finish before deploying.'
            : '';
        }
      };
      if (openVscode) openVscode.addEventListener('click', async function () {
        status('Opening VS Code...');
        var result = await postJson('/open-vscode');
        status(result.ok ? (result.message || 'Opened in VS Code: ' + result.dir) : result.message);
      });
      if (saveGithub) saveGithub.addEventListener('click', async function () {
        status('Saving to GitHub...');
        var result = await postJson('/save-github');
        if (result.ok) { window.open(result.url, '_blank'); status('', result.url); }
        else { status(result.message || 'Save to GitHub failed.'); }
      });
      if (deployAzure) deployAzure.addEventListener('click', async function () {
        if (deployAzure.disabled) { status(deployAzure.title); return; }
        status(deployAzure.dataset.startMessage || 'Preparing Azure Functions azd project...');
        var lbl = deployAzure.querySelector('.label');
        var idleLabel = deployAzure.dataset.label || 'Deploy to Azure';
        if (lbl) lbl.textContent = 'Deploying...';
        var result = await postJson('/deploy-azure');
        if (lbl && !result.ok) lbl.textContent = idleLabel;
        status(result.message || (result.ok ? 'azd up launched.' : 'Deploy setup needs attention.'));
      });
    })();
  `;
}

export function safeSegment(value) {
	return String(value || "instance").replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80) || "instance";
}

export function responseJson(res, data) {
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

export function shortError(error) {
	return redactDeploymentOutput(error?.stderr || error?.stdout || error?.message || error || "Command failed")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 300);
}

function canExecuteCommand(file, osName = os.platform()) {
	try {
		accessSync(file, osName === "win32" ? constants.F_OK : constants.X_OK);
		return true;
	} catch {
		return false;
	}
}

function uniqueDirectories(directories, osName) {
	const seen = new Set();
	return directories.filter((directory) => {
		if (!directory) return false;
		const key = osName === "win32" ? directory.toLowerCase() : directory;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function commandNames(command, osName) {
	if (osName !== "win32") return [command];
	if ([".com", ".exe", ".bat", ".cmd"].includes(path.win32.extname(command).toLowerCase())) return [command];
	return [`${command}.exe`, `${command}.cmd`, `${command}.bat`, command];
}

function commandDirectories(source, osName, execPath, extraDirectories = []) {
	const paths = osName === "win32" ? path.win32 : path.posix;
	const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
	const home = source.HOME || source.USERPROFILE || os.homedir();
	const standard =
		osName === "win32"
			? [
					execPath ? paths.dirname(execPath) : "",
					source.NVM_SYMLINK,
					source.NPM_CONFIG_PREFIX,
					source.APPDATA ? paths.join(source.APPDATA, "npm") : "",
					source.ProgramFiles ? paths.join(source.ProgramFiles, "nodejs") : "",
					source.LOCALAPPDATA ? paths.join(source.LOCALAPPDATA, "Programs", "Microsoft VS Code", "bin") : "",
					paths.join(source.ProgramFiles || "C:\\Program Files", "Microsoft VS Code", "bin"),
					paths.join(source["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Microsoft VS Code", "bin"),
					source.LOCALAPPDATA ? paths.join(source.LOCALAPPDATA, "Programs", "Azure Dev CLI") : "",
					paths.join(source.ProgramFiles || "C:\\Program Files", "Azure Dev CLI"),
					paths.join(source.ProgramFiles || "C:\\Program Files", "Microsoft", "Azure Functions Core Tools"),
					home ? paths.join(home, ".local", "bin") : "",
					home ? paths.join(home, ".cargo", "bin") : "",
					home ? paths.join(home, ".azd", "bin") : "",
					home ? paths.join(home, ".azure-functions") : "",
					paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32"),
				]
			: [
					execPath ? paths.dirname(execPath) : "",
					source.NPM_CONFIG_PREFIX ? paths.join(source.NPM_CONFIG_PREFIX, "bin") : "",
					osName === "darwin" ? "/Applications/Visual Studio Code.app/Contents/Resources/app/bin" : "",
					"/opt/homebrew/bin",
					"/usr/local/bin",
					"/opt/local/bin",
					home ? paths.join(home, ".local", "bin") : "",
					home ? paths.join(home, ".cargo", "bin") : "",
					home ? paths.join(home, ".azd", "bin") : "",
					"/usr/bin",
					"/bin",
					"/snap/bin",
				];
	return uniqueDirectories([...extraDirectories, ...inherited, ...standard], osName);
}

export function locateExternalCommand(
	command,
	{
		env = process.env,
		osName = os.platform(),
		execPath = process.execPath,
		extraDirectories = [],
		exists = (candidate) => canExecuteCommand(candidate, osName),
	} = {},
) {
	const paths = osName === "win32" ? path.win32 : path.posix;
	const searched = [];
	if (paths.isAbsolute(command) || /[\\/]/.test(command)) {
		searched.push(command);
		return exists(command)
			? { found: true, path: command, directory: paths.dirname(command), searched }
			: { found: false, path: "", directory: "", searched };
	}
	for (const directory of commandDirectories(env, osName, execPath, extraDirectories)) {
		for (const name of commandNames(command, osName)) {
			const candidate = paths.join(directory, name);
			searched.push(candidate);
			if (exists(candidate)) return { found: true, path: candidate, directory, searched };
		}
	}
	return { found: false, path: "", directory: "", searched };
}

export class ExternalCommandNotFoundError extends Error {
	constructor(command, searched = []) {
		super(`${command} executable was not found.`);
		this.name = "ExternalCommandNotFoundError";
		this.code = "EXTERNAL_COMMAND_NOT_FOUND";
		this.command = command;
		this.searched = searched;
	}
}

function commandChildEnv(source, located, osName) {
	const paths = osName === "win32" ? path.win32 : path.posix;
	const env = { ...source };
	delete env.Path;
	delete env.path;
	const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
	// Locating a host tool must not switch its Python children out of an activated environment.
	const virtualEnvBin = source.VIRTUAL_ENV
		? paths.join(source.VIRTUAL_ENV, osName === "win32" ? "Scripts" : "bin")
		: null;
	const fallbacks =
		osName === "win32"
			? [
					paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32"),
					source.SystemRoot || source.SYSTEMROOT || "C:\\Windows",
				]
			: ["/usr/local/bin", "/usr/bin", "/bin"];
	env.PATH = uniqueDirectories([virtualEnvBin, located.directory, ...inherited, ...fallbacks], osName).join(paths.delimiter);
	if (osName === "win32" && !env.ComSpec && !env.COMSPEC) {
		env.ComSpec = paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
	}
	return env;
}

function quoteWindowsCommandArgument(value) {
	const text = String(value);
	if (/[%\r\n]/.test(text)) {
		throw new Error("Command arguments contain unsupported Windows command characters.");
	}
	return `"${text.replace(/"/g, '""')}"`;
}

function spawnSpecForLocated(located, args, env, osName) {
	if (osName === "win32" && /\.(?:cmd|bat)$/i.test(located.path)) {
		const comSpec =
			env.ComSpec ||
			env.COMSPEC ||
			path.win32.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
		return {
			file: comSpec,
			args: [
				"/d",
				"/s",
				"/c",
				`call ${[located.path, ...args].map(quoteWindowsCommandArgument).join(" ")}`,
			],
			env,
			located,
			windowsVerbatimArguments: true,
		};
	}
	return { file: located.path, args: [...args], env, located, windowsVerbatimArguments: false };
}

const NPM_PREFIX_CACHE_MS = 5000;
const npmPrefixCache = new Map();

async function npmGlobalDirectories({
	env,
	osName,
	execPath,
	execute,
	locate,
}) {
	const cacheKey = `${osName}\0${execPath}\0${sourcePath(env)}\0${env.NPM_CONFIG_PREFIX || ""}`;
	const cached = npmPrefixCache.get(cacheKey);
	if (cached && Date.now() - cached.at < NPM_PREFIX_CACHE_MS) return cached.directories;
	const npm = locate("npm", { env, osName, execPath });
	if (!npm.found) return [];
	const childEnv = commandChildEnv(env, npm, osName);
	const command = spawnSpecForLocated(npm, ["prefix", "-g"], childEnv, osName);
	try {
		const { stdout } = await execute(command.file, command.args, {
			env: command.env,
			timeout: 10000,
			windowsVerbatimArguments: command.windowsVerbatimArguments,
		});
		const prefix = stdout.trim();
		if (!prefix) return [];
		const paths = osName === "win32" ? path.win32 : path.posix;
		const directories = osName === "win32" ? [prefix] : [paths.join(prefix, "bin"), prefix];
		npmPrefixCache.set(cacheKey, { at: Date.now(), directories });
		return directories;
	} catch {
		return [];
	}
}

export async function externalCommandSpawnSpec(
	command,
	args,
	{
		env = process.env,
		osName = os.platform(),
		execPath = process.execPath,
		execute = execFileText,
		locate = locateExternalCommand,
		discoverNpmDirectories = npmGlobalDirectories,
		extraDirectories = [],
	} = {},
) {
	assertFixtureAuthenticationDenied(command, args);
	let located = locate(command, { env, osName, execPath, extraDirectories });
	if (!located.found && command !== "npm") {
		const npmDirectories = await discoverNpmDirectories({ env, osName, execPath, execute, locate });
		if (npmDirectories.length) {
			located = locate(command, { env, osName, execPath, extraDirectories: [...extraDirectories, ...npmDirectories] });
		}
	}
	if (!located.found) throw new ExternalCommandNotFoundError(command, located.searched);
	return spawnSpecForLocated(located, args, commandChildEnv(env, located, osName), osName);
}

export async function runExternalCommandText(
	command,
	args,
	{
		env = process.env,
		execute = execFileText,
		osName = os.platform(),
		execPath = process.execPath,
		locate = locateExternalCommand,
		discoverNpmDirectories = npmGlobalDirectories,
		maxBuffer = 1024 * 1024,
		...execOptions
	} = {},
) {
	const resolved = await externalCommandSpawnSpec(command, args, {
		env,
		execute,
		osName,
		execPath,
		locate,
		discoverNpmDirectories,
	});
	return execute(resolved.file, resolved.args, {
		maxBuffer,
		...execOptions,
		env: resolved.env,
		windowsVerbatimArguments: resolved.windowsVerbatimArguments,
	});
}

export function terminateChildProcess(
	child,
	signal = "SIGTERM",
	{
		osName = os.platform(),
		env = process.env,
		killTree = spawnSync,
	} = {},
) {
	if (!child || child.exitCode !== null) return false;
	if (osName === "win32" && child.pid) {
		try {
			const taskkill = path.win32.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32", "taskkill.exe");
			const result = killTree(taskkill, ["/pid", String(child.pid), "/t", "/f"], {
				stdio: "ignore",
				windowsHide: true,
			});
			if (!result?.error) return true;
		} catch {
			/* Fall back to the direct child when taskkill is unavailable. */
		}
	}
	if (osName !== "win32" && child.pid) {
		try {
			process.kill(-child.pid, signal);
			return true;
		} catch {
			/* Fall back when the child predates process-group management. */
		}
	}
	try {
		return child.kill(signal);
	} catch {
		return false;
	}
}

const AZURE_CLI_ENV_KEYS = [
	"HOME",
	"USER",
	"LOGNAME",
	"TMPDIR",
	"LANG",
	"LC_ALL",
	"SHELL",
	"USERPROFILE",
	"HOMEDRIVE",
	"HOMEPATH",
	"SystemRoot",
	"SYSTEMROOT",
	"TEMP",
	"TMP",
	"ComSpec",
	"COMSPEC",
	"PATHEXT",
	"AZURE_CONFIG_DIR",
	"XDG_CONFIG_HOME",
	"HTTP_PROXY",
	"HTTPS_PROXY",
	"ALL_PROXY",
	"NO_PROXY",
	"http_proxy",
	"https_proxy",
	"all_proxy",
	"no_proxy",
	"REQUESTS_CA_BUNDLE",
	"CURL_CA_BUNDLE",
	"SSL_CERT_FILE",
	"SSL_CERT_DIR",
	"AZURE_CLI_DISABLE_CONNECTION_VERIFICATION",
];

function sourcePath(source) {
	return source.PATH || source.Path || source.path || "";
}

export function locateAzureCli(
	source = process.env,
	osName = os.platform(),
	exists = (candidate) => canExecuteCommand(candidate, osName),
) {
	const paths = osName === "win32" ? path.win32 : path.posix;
	const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
	const home = source.HOME || source.USERPROFILE || os.homedir();
	const known =
		osName === "win32"
			? [
					paths.join(source.ProgramFiles || "C:\\Program Files", "Microsoft SDKs", "Azure", "CLI2", "wbin"),
					paths.join(
						source["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
						"Microsoft SDKs",
						"Azure",
						"CLI2",
						"wbin",
					),
				]
			: [
					"/opt/homebrew/bin",
					"/usr/local/bin",
					"/opt/local/bin",
					paths.join(home, ".local", "bin"),
					paths.join(home, "bin"),
					"/usr/bin",
					"/bin",
					"/snap/bin",
				];
	const directories = [...new Set([...inherited, ...known])];
	const searched = [];
	if (source.AZURE_CLI_PATH) {
		searched.push(source.AZURE_CLI_PATH);
		if (exists(source.AZURE_CLI_PATH)) {
			return {
				found: true,
				path: source.AZURE_CLI_PATH,
				directory: paths.dirname(source.AZURE_CLI_PATH),
				searched,
			};
		}
	}
	for (const directory of directories) {
		for (const name of osName === "win32" ? ["az.cmd", "az.exe", "az"] : ["az"]) {
			const candidate = paths.join(directory, name);
			searched.push(candidate);
			if (exists(candidate)) return { found: true, path: candidate, directory, searched };
		}
	}
	return { found: false, path: "", directory: "", searched };
}

export class AzureCliNotFoundError extends Error {
	constructor(searched = []) {
		super(
			"Azure CLI executable was not found. Install Azure CLI or set AZURE_CLI_PATH to its absolute path, then retry.",
		);
		this.name = "AzureCliNotFoundError";
		this.code = "AZURE_CLI_NOT_FOUND";
		this.searched = searched;
	}
}

export function isAzureCliNotFoundError(error) {
	return error?.code === "AZURE_CLI_NOT_FOUND" || error?.name === "AzureCliNotFoundError";
}

export function isAzureCliLoginRequiredError(error) {
	return /(?:please run ['"`]?az login|run ['"`]?az login|not logged in|login required|no subscriptions found)/i.test(
		shortError(error),
	);
}

// Keep Azure CLI on the user's existing token cache, retain network trust
// settings, repair GUI-host PATH loss, and strip broker-specific variables.
export function azureCliChildEnv(
	source = process.env,
	located = locateAzureCli(source),
	osName = os.platform(),
) {
	const paths = osName === "win32" ? path.win32 : path.posix;
	const env = {};
	for (const key of AZURE_CLI_ENV_KEYS) {
		if (source[key] != null) env[key] = source[key];
	}
	const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
	const fallbacks =
		osName === "win32"
			? [
					paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32"),
					source.SystemRoot || source.SYSTEMROOT || "C:\\Windows",
				]
			: ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
	env.PATH = [...new Set([...(located.found ? [located.directory] : []), ...inherited, ...fallbacks])].join(
		paths.delimiter,
	);
	if (osName === "win32" && !env.ComSpec && !env.COMSPEC) {
		env.ComSpec = paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
	}
	return env;
}

export function azureCliSpawnSpec(
	args,
	{
		env = process.env,
		osName = os.platform(),
		locate = locateAzureCli,
	} = {},
) {
	assertFixtureAuthenticationDenied("az");
	const located = locate(env, osName);
	if (!located.found) throw new AzureCliNotFoundError(located.searched);
	const childEnv = azureCliChildEnv(env, located, osName);
	return spawnSpecForLocated(located, args, childEnv, osName);
}

// Corporate networks often block the public PyPI CDN (files.pythonhosted.org)
// while allowing an approved package mirror. `uv` does not read pip's config,
// so resolve the live pip policy for every bootstrap instead of caching the
// extension host's startup snapshot. The Microsoft default is opt-in and must
// be enabled by a caller that has current corporate identity evidence.
export const MICROSOFT_CORPORATE_PYPI_INDEX = "https://packagefeedproxy.microsoft.io/pypi/simple/";

function homedirForEnv(env = process.env) {
	return env.HOME || env.USERPROFILE || os.homedir();
}

function pipConfigPaths(env = process.env, osName = process.platform) {
	const home = homedirForEnv(env);
	if (osName === "win32") {
		return [
			env.PIP_CONFIG_FILE,
			env.PROGRAMDATA ? path.win32.join(env.PROGRAMDATA, "pip", "pip.ini") : "",
			env.APPDATA ? path.win32.join(env.APPDATA, "pip", "pip.ini") : "",
			home ? path.win32.join(home, "pip", "pip.ini") : "",
			home ? path.win32.join(home, ".config", "pip", "pip.ini") : "",
		].filter(Boolean);
	}
	if (osName === "darwin") {
		return [
			env.PIP_CONFIG_FILE,
			"/Library/Application Support/pip/pip.conf",
			"/opt/homebrew/share/pip/pip.conf",
			home ? path.posix.join(home, ".config", "pip", "pip.conf") : "",
			home ? path.posix.join(home, ".pip", "pip.conf") : "",
		].filter(Boolean);
	}
	return [
		env.PIP_CONFIG_FILE,
		"/etc/pip.conf",
		"/etc/xdg/pip/pip.conf",
		home ? path.posix.join(home, ".config", "pip", "pip.conf") : "",
		home ? path.posix.join(home, ".pip", "pip.conf") : "",
	].filter(Boolean);
}

function parseIndexUrlFromIni(text) {
	const match = /^\s*index-url\s*=\s*(\S+)\s*$/im.exec(text);
	return match ? match[1] : "";
}

function parseIndexUrlFromPipConfig(text) {
	const match = /^\s*(?:(?:global|install)\.index-url|:env:\.index-url)\s*=\s*'?([^'\r\n]+)'?\s*$/im.exec(text);
	return match ? match[1].trim() : "";
}

export function isMicrosoftCorporateIdentity(user) {
	return /@microsoft\.com$/i.test(String(user || "").trim());
}

export function packageIndexHost(url) {
	if (!url) return "pypi.org";
	try {
		return new URL(url).hostname || "configured package index";
	} catch {
		return "configured package index";
	}
}

export async function resolvePipIndex({
	env = process.env,
	osName = process.platform,
	runCommand = runExternalCommandText,
	readText = readFile,
	configPaths,
	allowMicrosoftCorporateDefault = false,
} = {}) {
	const configured = [
		["PIP_INDEX_URL", env.PIP_INDEX_URL],
		["UV_INDEX_URL", env.UV_INDEX_URL],
		["UV_DEFAULT_INDEX", env.UV_DEFAULT_INDEX],
	].find(([, value]) => String(value || "").trim());
	if (configured) {
		const url = String(configured[1]).trim();
		return { url, host: packageIndexHost(url), source: configured[0], corporateDefault: false };
	}

	// `pip config list` resolves pip's own precedence across global, site, and
	// user files. Run it through the shared command resolver so a sanitized
	// Windows extension PATH can still reach pip.exe or a command shim.
	for (const pipBin of ["pip3", "pip"]) {
		try {
			const { stdout } = await runCommand(pipBin, ["config", "list"], {
				env,
				osName,
				timeout: 5000,
			});
			const url = parseIndexUrlFromPipConfig(stdout);
			if (url) return { url, host: packageIndexHost(url), source: `${pipBin} config`, corporateDefault: false };
		} catch {
			/* pip not installed or config command unavailable */
		}
	}

	for (const confPath of configPaths || pipConfigPaths(env, osName)) {
		try {
			const url = parseIndexUrlFromIni(await readText(confPath, "utf8"));
			if (url) return { url, host: packageIndexHost(url), source: "pip config file", corporateDefault: false };
		} catch {
			/* config file not present at this path */
		}
	}

	if (allowMicrosoftCorporateDefault) {
		return {
			url: MICROSOFT_CORPORATE_PYPI_INDEX,
			host: packageIndexHost(MICROSOFT_CORPORATE_PYPI_INDEX),
			source: "Microsoft corporate policy",
			corporateDefault: true,
		};
	}
	return { url: "", host: "pypi.org", source: "uv default", corporateDefault: false };
}

export async function findPipIndexUrl(options) {
	return (await resolvePipIndex(options)).url;
}

// Keep uv and fallback pip on the same selected index. Returning {} preserves
// the normal public default when no configured policy or corporate evidence is
// present.
export async function uvIndexEnv(options = {}) {
	const resolution = options.resolution || (await resolvePipIndex(options));
	if (!resolution.url) return {};
	return {
		PIP_INDEX_URL: resolution.url,
		UV_INDEX_URL: resolution.url,
		UV_DEFAULT_INDEX: resolution.url,
	};
}

export function pythonPackageInstallErrorMessage(error, resolution) {
	const detail = redactDeploymentOutput(
		String(error?.stderr || error?.stdout || error?.message || error || "Package installation failed"),
	)
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 500);
	const host = resolution?.host || "the selected package index";
	if (
		/no matching distribution|could not find a version|package .* was not found|no solution found|not found in the package registry/i.test(
			detail,
		)
	) {
		return `A required Python package was not found on ${host}. ${detail}`;
	}
	if (
		/timed? ?out|connection|connect error|certificate|tls|ssl|proxy|network|failed to fetch|error sending request|\b(?:401|403|407|429|5\d\d)\s+(?:forbidden|unauthorized|proxy|too many requests|server error)/i.test(
			detail,
		)
	) {
		return `Could not reach the selected Python package index ${host}. Check mirror access, proxy, and CA settings. ${detail}`;
	}
	return `Python dependency installation from ${host} failed. ${detail}`;
}

function tokenExpiryMs(token) {
	const epochSeconds = Number(token?.expires_on || token?.expiresOnTimestamp || 0);
	if (Number.isFinite(epochSeconds) && epochSeconds > 0) return epochSeconds * 1000;
	const parsed = Date.parse(String(token?.expiresOn || ""));
	return Number.isFinite(parsed) ? parsed : 0;
}

export function createAzureCliSession(runJson, { metadataTtlMs = 5 * 60 * 1000, now = () => Date.now() } = {}) {
	const values = new Map();
	const pending = new Map();
	const generations = new Map();

	async function cached(key, validUntil, loader, force = false) {
		const existing = values.get(key);
		if (!force && existing && existing.validUntil > now()) return existing.value;
		if (!force && pending.has(key)) return pending.get(key);
		const generation = (generations.get(key) || 0) + 1;
		generations.set(key, generation);
		const promise = Promise.resolve()
			.then(loader)
			.then((value) => {
				if (generations.get(key) === generation) {
					values.set(key, { value, validUntil: validUntil(value) });
				}
				return value;
			})
			.finally(() => {
				if (pending.get(key) === promise) pending.delete(key);
			});
		pending.set(key, promise);
		return promise;
	}

	return {
		account(force = false) {
			return cached("account", () => now() + metadataTtlMs, () => runJson(["account", "show", "-o", "json"]), force);
		},
		subscriptions(force = false) {
			return cached(
				"subscriptions",
				() => now() + metadataTtlMs,
				() => runJson(["account", "list", "--query", "[?state=='Enabled']", "-o", "json"]),
				force,
			);
		},
		accessToken(subscription, resource, force = false) {
			const key = `token:${subscription || "default"}:${resource}`;
			return cached(
				key,
				(token) => Math.max(now(), tokenExpiryMs(token) - 5 * 60 * 1000),
				() => runJson(["account", "get-access-token", "--resource", resource, "-o", "json"], subscription),
				force,
			);
		},
		clear() {
			values.clear();
			generations.clear();
		},
	};
}

export async function runAzureCliJson(
	args,
	subscription,
	{
		timeout = 30000,
		maxBuffer = 1024 * 1024,
		env = process.env,
		execute = execFileText,
		locate = locateAzureCli,
		osName = os.platform(),
	} = {},
) {
	const full = subscription ? [...args, "--subscription", subscription] : [...args];
	const withFlag = full.includes("--only-show-errors") ? full : [...full, "--only-show-errors"];
	const { stdout } = await runAzureCliText(withFlag, { env, maxBuffer, timeout, execute, locate, osName });
	const text = stdout.trim();
	return text ? JSON.parse(text) : null;
}

export async function runAzureCliText(
	args,
	{
		env = process.env,
		execute = execFileText,
		locate = locateAzureCli,
		osName = os.platform(),
		...options
	} = {},
) {
	const command = azureCliSpawnSpec(args, { env, locate, osName });
	return execute(command.file, command.args, {
		maxBuffer: 1024 * 1024,
		...options,
		env: command.env,
		windowsVerbatimArguments: command.windowsVerbatimArguments,
	});
}

const fixtureAuthCommands = [];

function assertFixtureAuthenticationDenied(command, args = []) {
	if (process.env.FUNCTION_STUDIO_TEST_MODE !== "1") return;
	const name = path.win32.basename(String(command)).replace(/\.(?:cmd|bat|exe)$/i, "").toLowerCase();
	const gitRemote = name === "git" && args.some((arg) => ["clone", "fetch", "pull", "push", "ls-remote", "credential"].includes(arg));
	const packageInstall = (["npm", "npx", "pip", "pip3", "uv"].includes(name) && args.some((arg) => ["install", "exec", "add", "run"].includes(arg)))
		|| (/^python(?:\d+(?:\.\d+)?)?$/.test(name) && args.includes("pip") && args.includes("install"));
	if (!gitRemote && !packageInstall && !["az", "azd", "gh", "azureauth", "security", "codesign", "npx"].includes(name)) return;
	fixtureAuthCommands.push(name);
	throw new Error(`Live authentication command '${name}' is disabled in Hosted Skills fixture mode. Inject a fake service instead.`);
}

export function fixtureAuthenticationAttempts() {
	return [...fixtureAuthCommands];
}

export function execFileText(file, args, options = {}) {
	return new Promise((resolve, reject) => {
		assertFixtureAuthenticationDenied(file, args);
		execFile(file, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
			if (error) {
				error.stdout = stdout;
				error.stderr = stderr;
				reject(error);
				return;
			}
			resolve({ stdout, stderr });
		});
	});
}

export async function exists(filePath) {
	try {
		await stat(filePath);
		return true;
	} catch {
		return false;
	}
}

// Write a { relativePath: content } map into baseDir, creating parent folders.
export async function writeFiles(baseDir, files) {
	await mkdir(baseDir, { recursive: true });
	for (const [relativePath, content] of Object.entries(files)) {
		const filePath = path.join(baseDir, relativePath);
		await mkdir(path.dirname(filePath), { recursive: true });
		await writeFile(filePath, content);
	}
	return baseDir;
}

const REDACTED_MODE_PATTERN = /\buse\s+redacted\s+mode\b/i;
const REDACTED_COPY_SKIP = new Set([".git", ".venv", "node_modules", "__pycache__"]);

function isSensitiveKey(key) {
	const normalized = String(key || "")
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/[^A-Za-z0-9]+/g, "_")
		.toLowerCase();
	const compact = normalized.replaceAll("_", "");
	return (
		/(^|_)(secret|password|credential|token|sas|signature)($|_)/.test(normalized) ||
		compact.includes("apikey") ||
		compact.includes("clientsecret") ||
		compact.includes("functionkey") ||
		compact.includes("masterkey") ||
		compact.includes("connectionstring") ||
		compact === "azurewebjobsstorage"
	);
}

export function requestsRedactedMode(contents = []) {
	return contents.some((content) => REDACTED_MODE_PATTERN.test(String(content || "")));
}

async function projectInstructionContents(dir) {
	const instructionsPath = path.join(dir, ".github", "copilot-instructions.md");
	if (!(await exists(instructionsPath))) return [];
	return [await readFile(instructionsPath, "utf8")];
}

export async function shouldUseRedactedMode(dir, instructionContents = []) {
	return requestsRedactedMode([...instructionContents, ...(await projectInstructionContents(dir))]);
}

export async function readGlobalAppInstructionContents(
	dbPath = path.join(os.homedir(), ".copilot", "data.db"),
) {
	if (!(await exists(dbPath))) return [];
	let DatabaseSync;
	try {
		({ DatabaseSync } = await import("node:sqlite"));
	} catch (error) {
		throw new Error(`Cannot read global Sessions instructions safely: ${shortError(error)}`);
	}
	const db = new DatabaseSync(dbPath, { readOnly: true });
	try {
		const row = db.prepare("SELECT instructions FROM settings WHERE id = 1").get();
		return typeof row?.instructions === "string" && row.instructions.trim() ? [row.instructions] : [];
	} finally {
		db.close();
	}
}

function redactEnv(text) {
	const lines = text.split(/\r?\n/);
	let multilineQuote = "";
	return lines
		.map((line) => {
			if (multilineQuote) {
				if (line.includes(multilineQuote)) multilineQuote = "";
				return "REDACTED";
			}
			if (!line.trim() || line.trimStart().startsWith("#")) return line;
			const assignment = line.match(
				/^(\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*)(.*)$/,
			);
			if (!assignment || !isSensitiveKey(assignment[2])) return line;
			const value = assignment[3].trim();
			const openingQuote = value[0] === '"' || value[0] === "'" ? value[0] : "";
			if (openingQuote && !value.slice(1).includes(openingQuote)) multilineQuote = openingQuote;
			return `${assignment[1]}"REDACTED"`;
		})
		.join("\n");
}

function redactJsonValue(value, key = "", redactAll = false) {
	const shouldRedact = redactAll || isSensitiveKey(key);
	if (Array.isArray(value)) {
		return value.map((item) => redactJsonValue(item, key, shouldRedact));
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([childKey, childValue]) => [
				childKey,
				redactJsonValue(childValue, childKey, shouldRedact),
			]),
		);
	}
	return shouldRedact ? "REDACTED" : value;
}

function redactLocalSettings(text) {
	const settings = JSON.parse(text);
	return `${JSON.stringify(redactJsonValue(settings), null, 2)}\n`;
}

async function redactProjectConfigs(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const filePath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await redactProjectConfigs(filePath);
			continue;
		}
		if (!entry.isFile()) continue;
		if (entry.name === ".env" || entry.name.startsWith(".env.")) {
			await writeFile(filePath, redactEnv(await readFile(filePath, "utf8")), { mode: 0o600 });
		} else if (entry.name === "local.settings.json") {
			await writeFile(filePath, redactLocalSettings(await readFile(filePath, "utf8")), { mode: 0o600 });
		}
	}
}

export async function createRedactedProjectCopy(dir) {
	const tempRoot = await mkdtemp(path.join(os.tmpdir(), "cloud-foundation-redacted-"));
	const redactedDir = path.join(tempRoot, path.basename(dir));
	await cp(dir, redactedDir, {
		recursive: true,
		filter: async (source) => {
			if (source === dir) return true;
			const relative = path.relative(dir, source);
			if (relative.split(path.sep).some((segment) => REDACTED_COPY_SKIP.has(segment))) return false;
			return !(await lstat(source)).isSymbolicLink();
		},
	});
	await redactProjectConfigs(redactedDir);
	return redactedDir;
}

const DEPLOYMENT_COPY_SKIP = new Set([
	".git",
	".venv",
	".azurite",
	".intelligent-function-app-studio",
	".azure-functions-hosted-skills",
	"node_modules",
	"__pycache__",
]);

export async function prepareDeploymentProjectCopy(sourceDir, deployDir) {
	const source = path.resolve(sourceDir);
	const destination = path.resolve(deployDir);
	if (source === destination || destination.startsWith(`${source}${path.sep}`)) {
		throw new Error("Deployment workspace must be outside the generated app source.");
	}
	await mkdir(path.dirname(destination), { recursive: true });
	const nonce = `${process.pid}-${Date.now()}`;
	const nextDestination = `${destination}.next-${nonce}`;
	const previousDestination = `${destination}.previous-${nonce}`;
	const existingAzure = path.join(destination, ".azure");
	await rm(nextDestination, { recursive: true, force: true });
	await rm(previousDestination, { recursive: true, force: true });
	try {
		await cp(source, nextDestination, {
			recursive: true,
			filter: async (candidate) => {
				if (candidate === source) return true;
				const relative = path.relative(source, candidate);
				if (relative.split(path.sep).some((segment) => DEPLOYMENT_COPY_SKIP.has(segment))) return false;
				return !(await lstat(candidate)).isSymbolicLink();
			},
		});
		if (await exists(existingAzure)) {
			await rm(path.join(nextDestination, ".azure"), { recursive: true, force: true });
			await cp(existingAzure, path.join(nextDestination, ".azure"), { recursive: true });
		}
		if (await exists(destination)) await rename(destination, previousDestination);
		try {
			await rename(nextDestination, destination);
		} catch (error) {
			if (await exists(previousDestination)) await rename(previousDestination, destination);
			throw error;
		}
		await rm(previousDestination, { recursive: true, force: true });
		return destination;
	} finally {
		await rm(nextDestination, { recursive: true, force: true });
	}
}

export function redactDeploymentOutput(value) {
	return String(value || "")
		.replace(/(https?:\/\/)[^/\s@]+@/gi, "$1[REDACTED]@")
		.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
		.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
		.replace(
			/((?:^|[\s,{])["']?[A-Za-z0-9_-]*(?:token|secret|password|key|connection[_-]?string)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
			"$1[REDACTED]",
		)
		.replace(/([?&](?:code|key|sig|token|secret)=)[^&\s]+/gi, "$1[REDACTED]");
}

export function createAzdPhaseTracker({ now = () => Date.now() } = {}) {
	const phases = Object.fromEntries(
		["provision", "package", "deploy"].map((name) => [
			name,
			{ name, state: "pending", startedAt: null, endedAt: null, durationMs: null, detail: "" },
		]),
	);
	const emit = (name, state, detail = "") => {
		const phase = phases[name];
		if (
			!phase ||
			phase.state === state ||
			["completed", "failed", "cancelled"].includes(phase.state)
		) {
			return null;
		}
		const timestamp = now();
		if (state === "started") {
			phase.state = "started";
			phase.startedAt = timestamp;
		} else {
			if (!phase.startedAt) phase.startedAt = timestamp;
			phase.state = state;
			phase.endedAt = timestamp;
			phase.durationMs = Math.max(0, timestamp - phase.startedAt);
		}
		phase.detail = detail;
		return { ...phase };
	};
	const feed = (line) => {
		const text = redactDeploymentOutput(line).trim();
		const events = [];
		const push = (event) => {
			if (event) events.push(event);
		};
		if (/Provisioning Azure resources(?:\s*\(azd provision\))?/i.test(text)) {
			push(emit("provision", "started", text));
		}
		if (/SUCCESS:.*\bprovisioned\b/i.test(text)) {
			push(emit("provision", "completed", text));
		}
		if (/Packaging services?(?:\s*\(azd package\))?|Packaging service\b/i.test(text)) {
			if (phases.provision.state === "started") push(emit("provision", "completed", "azd advanced to package"));
			push(emit("package", "started", text));
		}
		if (/SUCCESS:.*\bpackaged\b/i.test(text)) {
			push(emit("package", "completed", text));
		}
		if (/Deploying services?(?:\s*\(azd deploy\))?/i.test(text)) {
			if (phases.provision.state === "started") push(emit("provision", "completed", "azd advanced to deploy"));
			if (phases.package.state === "started") push(emit("package", "completed", "azd advanced to deploy"));
			push(emit("deploy", "started", text));
		}
		if (/SUCCESS:.*\bdeployed\b/i.test(text)) {
			push(emit("deploy", "completed", text));
		}
		return events;
	};
	const finish = ({ ok, cancelled = false, detail = "" }) => {
		const events = [];
		const terminalState = cancelled ? "cancelled" : ok ? "completed" : "failed";
		for (const name of ["provision", "package", "deploy"]) {
			const phase = phases[name];
			if (["completed", "failed", "cancelled"].includes(phase.state)) continue;
			const suffix =
				phase.state === "pending" && ok
					? " This azd version did not emit a separate phase heading."
					: phase.state === "pending"
						? " azd exited before reporting this phase."
						: "";
			const event = emit(name, terminalState, `${detail}${suffix}`.trim());
			if (event) events.push(event);
		}
		return events;
	};
	return { phases, feed, finish };
}

// Command: Open in VS Code. REDACTED mode opens a scrubbed temporary copy.
export async function openVsCode(
	dir,
	{
		instructionContents = [],
		filePath = "",
		prepareCopy,
		env = process.env,
		osName = process.platform,
		resolveCommand = externalCommandSpawnSpec,
		spawnProcess = spawn,
	} = {},
) {
	const redacted = await shouldUseRedactedMode(dir, instructionContents);
	const openDir = redacted ? await createRedactedProjectCopy(dir) : dir;
	if (redacted && typeof prepareCopy === "function") {
		await prepareCopy(openDir);
	}
	let openFile = "";
	if (filePath) {
		const relativeFile = path.relative(dir, filePath);
		if (relativeFile.startsWith("..") || path.isAbsolute(relativeFile)) {
			throw new Error(`VS Code file must be inside the project: ${filePath}`);
		}
		openFile = path.join(openDir, relativeFile);
	}
	const args = openFile ? [openDir, "--goto", openFile] : [openDir];
	let codeCommand;
	try {
		codeCommand = await resolveCommand("code", args, { env, osName });
	} catch (error) {
		if (error?.code === "EXTERNAL_COMMAND_NOT_FOUND") {
			return {
				ok: false,
				dir: openDir,
				redacted,
				message: `VS Code 'code' command not found in PATH or standard install locations. Open this folder manually: ${openDir}`,
			};
		}
		return { ok: false, dir: openDir, redacted, message: shortError(error) };
	}
	return new Promise((resolve) => {
		const child = spawnProcess(codeCommand.file, codeCommand.args, {
			stdio: "ignore",
			detached: true,
			env: codeCommand.env,
			windowsVerbatimArguments: codeCommand.windowsVerbatimArguments,
		});
		child.once("error", (error) => {
			if (error?.code === "ENOENT") {
				resolve({
					ok: false,
					dir: openDir,
					redacted,
					message: `VS Code 'code' command could not be launched. Open this folder manually: ${openDir}`,
				});
				return;
			}
			resolve({ ok: false, dir: openDir, redacted, message: shortError(error) });
		});
		child.once("spawn", () => {
			child.unref();
			resolve({
				ok: true,
				dir: openDir,
				sourceDir: redacted ? dir : undefined,
				filePath: openFile || undefined,
				redacted,
				message: redacted
					? `Opened a REDACTED demo copy in VS Code: ${openDir}`
					: `Opened in VS Code: ${openDir}`,
			});
		});
	});
}

// Command: Save to GitHub. Inits a repo if needed, commits, and creates a
// private GitHub repo via the gh CLI. Caller handles the "already saved" case.
export async function saveToGitHub(dir, { repoName, commitMessage }) {
	try {
		if (!(await exists(path.join(dir, ".git")))) {
			await execFileText("git", ["init", "-b", "main"], { cwd: dir });
		}
		await execFileText("git", ["add", "-A"], { cwd: dir });
		const status = await execFileText("git", ["status", "--porcelain"], { cwd: dir });
		if (status.stdout.trim()) {
			try {
				await execFileText("git", ["commit", "-m", commitMessage], { cwd: dir });
			} catch {
				await execFileText(
					"git",
					[
						"-c",
						"user.name=Cloud Foundation",
						"-c",
						"user.email=noreply@localhost",
						"commit",
						"-m",
						commitMessage,
					],
					{ cwd: dir },
				);
			}
		}
		await execFileText("gh", ["repo", "create", repoName, "--private", "--source", dir, "--remote", "origin", "--push"], {
			cwd: dir,
		});
		const view = await execFileText("gh", ["repo", "view", repoName, "--json", "url", "-q", ".url"], { cwd: dir });
		const url = view.stdout.trim();
		return { ok: true, url, created: true, name: repoName };
	} catch (error) {
		return { ok: false, message: shortError(error) };
	}
}

// Command: Deploy to Azure. Verifies azd is installed, then launches `azd up`
// detached. onStatus receives partial deploy state for mid-flight broadcasts.
// onProcessExit (optional) is invoked exactly once, whenever this operation is
// fully done - either because it never actually started (azd missing, spawn
// failed) or, later and asynchronously, when the detached `azd up` process
// closes after its output streams drain. Callers that need to guard against overlapping azd
// operations (e.g. a concurrent `azd provision`) should key their guard's
// lifetime off onProcessExit, not off this function's returned promise, since
// that promise resolves as soon as the detached process is merely launched.
export async function deployToAzure(
	dir,
	{
		onStatus,
		onProcessExit,
		onOutput,
		onMilestone,
		env,
		environmentName,
		subscription,
		location,
		noPrompt = false,
		spawnProcess = spawn,
		runCommand = execFileText,
		resolveCommand = externalCommandSpawnSpec,
	} = {},
) {
	const azdArgs = ["up"];
	if (environmentName) azdArgs.push("--environment", environmentName);
	if (subscription) azdArgs.push("--subscription", subscription);
	if (location) azdArgs.push("--location", location);
	if (noPrompt) azdArgs.push("--no-prompt");
	const command = `cd ${dir} && azd ${azdArgs.join(" ")}`;
	const tracker = createAzdPhaseTracker();
	let sequence = 0;
	let cancelRequested = false;
	const lineBuffers = { stdout: "", stderr: "" };
	const notify = (patch) => {
		if (typeof onStatus === "function") onStatus(patch);
	};
	const notifyExit = (result) => {
		if (typeof onProcessExit === "function") onProcessExit(result);
	};
	const emitMilestones = (events) => {
		for (const event of events) {
			if (typeof onMilestone === "function") onMilestone(event);
		}
	};
	const childEnv = env ? { ...process.env, ...env } : process.env;

	let azdCommand;
	try {
		const versionCommand = await resolveCommand("azd", ["version"], { env: childEnv, execute: runCommand });
		await runCommand(versionCommand.file, versionCommand.args, {
			cwd: dir,
			env: versionCommand.env,
			windowsVerbatimArguments: versionCommand.windowsVerbatimArguments,
		});
		azdCommand = await resolveCommand("azd", azdArgs, { env: childEnv, execute: runCommand });
	} catch {
		const message = `azd not found. Run: ${command}`;
		emitMilestones(tracker.finish({ ok: false, detail: message }));
		notify({
			deployMode: RUNTIME_MODE.CLOUD,
			deployStatus: message,
			deployDir: dir,
			deployCommand: command,
			deployDocsUrl: AZD_DOCS_URL,
		});
		notifyExit({ ok: false, started: false, code: null, signal: null, message });
		return { ok: false, dir, message, command, docsUrl: AZD_DOCS_URL };
	}

	return new Promise((resolve) => {
		// azd handles Azure login, subscription selection, provision, and deploy.
		const child = spawnProcess(azdCommand.file, azdCommand.args, {
			cwd: dir,
			stdio: ["ignore", "pipe", "pipe"],
			detached: true,
			env: azdCommand.env,
			windowsVerbatimArguments: azdCommand.windowsVerbatimArguments,
		});
		const emitLine = (stream, line) => {
			const text = redactDeploymentOutput(line);
			if (!text) return;
			const event = { sequence: ++sequence, stream, text, at: Date.now() };
			if (typeof onOutput === "function") onOutput(event);
			emitMilestones(tracker.feed(text));
		};
		const consume = (stream, chunk) => {
			const text = lineBuffers[stream] + String(chunk);
			const lines = text.split(/\r?\n/);
			lineBuffers[stream] = lines.pop() || "";
			for (const line of lines) emitLine(stream, line);
			if (lineBuffers[stream].length > 120_000) {
				lineBuffers[stream] = "";
				emitLine(stream, "[output line omitted because it exceeded the safe display limit]");
			}
		};
		child.stdout?.on("data", (chunk) => consume("stdout", chunk));
		child.stderr?.on("data", (chunk) => consume("stderr", chunk));
		child.once("error", (error) => {
			const message = `Unable to launch azd up: ${shortError(error)}`;
			emitMilestones(tracker.finish({ ok: false, detail: message }));
			notify({ deployMode: RUNTIME_MODE.CLOUD, deployStatus: message, deployDir: dir, deployCommand: command });
			notifyExit({ ok: false, started: false, code: null, signal: null, message });
			resolve({ ok: false, dir, message, command });
		});
		child.once("spawn", () => {
			child.unref();
			const message = `azd up launched in ${dir}`;
			notify({
				deployMode: RUNTIME_MODE.CLOUD,
				deployStatus: message,
				deployDir: dir,
				deployCommand: command,
			});
			resolve({
				ok: true,
				dir,
				message,
				command,
				cancel: () => {
					if (child.exitCode != null || child.signalCode != null) return false;
					const signalled = terminateChildProcess(child);
					if (signalled) cancelRequested = true;
					return signalled;
				},
			});
			// Fires later, asynchronously, once the real azd process closes -
			// unref() only opts this process out of keeping the event loop alive
			// by itself; the close event still delivers normally as long as the
			// long-running canvas server process (which callers run this from)
			// stays alive, which it does for the lifetime of the open canvas.
			child.once("close", (code, signal) => {
				for (const stream of ["stdout", "stderr"]) {
					if (lineBuffers[stream]) emitLine(stream, lineBuffers[stream]);
					lineBuffers[stream] = "";
				}
				const cancelled = cancelRequested || signal === "SIGTERM";
				const ok = code === 0 && !cancelled;
				const message = cancelled
					? "Local azd command stopped; Azure operations already submitted may continue."
					: `azd up exited (code ${code ?? "null"}${signal ? `, signal ${signal}` : ""})`;
				emitMilestones(tracker.finish({ ok, cancelled, detail: message }));
				notifyExit({ ok, cancelled, started: true, code, signal, message });
			});
		});
	});
}

// Route helper: handles POST /open-vscode, /save-github, /deploy-azure. Returns
// true when it consumed the request. ctx supplies the canvas-specific glue:
//   materialize()        -> Promise<dir> with base project files written
//   materializeAzd()     -> Promise<dir> with base + azd project files written
//   instructionContents()-> Promise<string[]> with loaded session instructions
//   repoName()           -> string repo name for Save to GitHub
//   commitMessage        -> string commit message
//   existingRepoUrl()    -> string | null, short-circuits an already-saved repo
//   onRepoSaved(result)  -> called after a successful Save to GitHub
//   onDeployStatus(patch)-> called with partial deploy state during Deploy
export function handleCommandRoutes(req, res, ctx) {
	if (req.method !== "POST") return false;

	if (req.url === "/open-vscode") {
		(async () => {
			const dir = await ctx.materialize();
			const instructionContents = (await ctx.instructionContents?.()) || [];
			return openVsCode(dir, { instructionContents });
		})()
			.then((result) => responseJson(res, result))
			.catch((error) => responseJson(res, { ok: false, message: shortError(error) }));
		return true;
	}

	if (req.url === "/save-github") {
		(async () => {
			const existing = ctx.existingRepoUrl?.();
			if (existing) return { ok: true, url: existing, created: false };
			const dir = await ctx.materialize();
			const result = await saveToGitHub(dir, { repoName: ctx.repoName(), commitMessage: ctx.commitMessage });
			if (result.ok && typeof ctx.onRepoSaved === "function") ctx.onRepoSaved(result);
			return result;
		})()
			.then((result) => responseJson(res, result))
			.catch((error) => responseJson(res, { ok: false, message: shortError(error) }));
		return true;
	}

	if (req.url === "/deploy-azure") {
		ctx
			.materializeAzd()
			.then((dir) => deployToAzure(dir, { onStatus: ctx.onDeployStatus }))
			.then((result) => responseJson(res, result))
			.catch((error) => responseJson(res, { ok: false, message: shortError(error) }));
		return true;
	}

	return false;
}
