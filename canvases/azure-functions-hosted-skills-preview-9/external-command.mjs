import { execFile, spawnSync } from "node:child_process";
import { accessSync, constants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const executeText = promisify(execFile);

function canExecute(file, osName = os.platform()) {
	try {
		accessSync(file, osName === "win32" ? constants.F_OK : constants.X_OK);
		return true;
	} catch {
		return false;
	}
}

function sourcePath(env) {
	return env.PATH || env.Path || env.path || "";
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

function commandDirectories(env, osName, execPath, extraDirectories = []) {
	const paths = osName === "win32" ? path.win32 : path.posix;
	const inherited = sourcePath(env).split(paths.delimiter).filter(Boolean);
	const home = env.HOME || env.USERPROFILE || os.homedir();
	const standard = osName === "win32"
		? [
				execPath ? paths.dirname(execPath) : "",
				env.NVM_SYMLINK,
				env.NPM_CONFIG_PREFIX,
				env.APPDATA ? paths.join(env.APPDATA, "npm") : "",
				env.ProgramFiles ? paths.join(env.ProgramFiles, "nodejs") : "",
				paths.join(env.ProgramFiles || "C:\\Program Files", "Microsoft", "Azure Functions Core Tools"),
				home ? paths.join(home, ".local", "bin") : "",
				home ? paths.join(home, ".azure-functions") : "",
				paths.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32"),
			]
		: [
				execPath ? paths.dirname(execPath) : "",
				env.NPM_CONFIG_PREFIX ? paths.join(env.NPM_CONFIG_PREFIX, "bin") : "",
				"/opt/homebrew/bin",
				"/usr/local/bin",
				"/opt/local/bin",
				home ? paths.join(home, ".local", "bin") : "",
				"/usr/bin",
				"/bin",
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
		exists = (candidate) => canExecute(candidate, osName),
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
	const virtualEnvBin = source.VIRTUAL_ENV
		? paths.join(source.VIRTUAL_ENV, osName === "win32" ? "Scripts" : "bin")
		: null;
	const fallbacks = osName === "win32"
		? [
				paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32"),
				source.SystemRoot || source.SYSTEMROOT || "C:\\Windows",
			]
		: ["/usr/local/bin", "/usr/bin", "/bin"];
	env.PATH = uniqueDirectories(
		[virtualEnvBin, located.directory, ...sourcePath(source).split(paths.delimiter).filter(Boolean), ...fallbacks],
		osName,
	).join(paths.delimiter);
	if (osName === "win32" && !env.ComSpec && !env.COMSPEC) {
		env.ComSpec = paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
	}
	return env;
}

function quoteWindowsCommandArgument(value) {
	const text = String(value);
	if (/[%\r\n]/.test(text)) throw new Error("Command arguments contain unsupported Windows command characters.");
	return `"${text.replace(/"/g, '""')}"`;
}

function spawnSpecForLocated(located, args, env, osName) {
	if (osName === "win32" && /\.(?:cmd|bat)$/i.test(located.path)) {
		const comSpec = env.ComSpec || env.COMSPEC ||
			path.win32.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
		return {
			file: comSpec,
			args: ["/d", "/s", "/c", `call ${[located.path, ...args].map(quoteWindowsCommandArgument).join(" ")}`],
			env,
			located,
			windowsVerbatimArguments: true,
		};
	}
	return { file: located.path, args: [...args], env, located, windowsVerbatimArguments: false };
}

const NPM_PREFIX_CACHE_MS = 5000;
const npmPrefixCache = new Map();

async function npmGlobalDirectories({ env, osName, execPath, execute, locate }) {
	const cacheKey = `${osName}\0${execPath}\0${sourcePath(env)}\0${env.NPM_CONFIG_PREFIX || ""}`;
	const cached = npmPrefixCache.get(cacheKey);
	if (cached && Date.now() - cached.at < NPM_PREFIX_CACHE_MS) return cached.directories;
	const npm = locate("npm", { env, osName, execPath });
	if (!npm.found) return [];
	const command = spawnSpecForLocated(npm, ["prefix", "-g"], commandChildEnv(env, npm, osName), osName);
	try {
		const { stdout } = await execute(command.file, command.args, {
			env: command.env,
			timeout: 10_000,
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
		execute = executeText,
		locate = locateExternalCommand,
		discoverNpmDirectories = npmGlobalDirectories,
		extraDirectories = [],
	} = {},
) {
	let located = locate(command, { env, osName, execPath, extraDirectories });
	if (!located.found && command !== "npm") {
		const npmDirectories = await discoverNpmDirectories({ env, osName, execPath, execute, locate });
		located = locate(command, {
			env,
			osName,
			execPath,
			extraDirectories: [...extraDirectories, ...npmDirectories],
		});
	}
	if (!located.found) throw new ExternalCommandNotFoundError(command, located.searched);
	return spawnSpecForLocated(located, args, commandChildEnv(env, located, osName), osName);
}

export async function runExternalCommandText(
	command,
	args,
	{
		env = process.env,
		execute = executeText,
		osName = os.platform(),
		execPath = process.execPath,
		locate = locateExternalCommand,
		discoverNpmDirectories = npmGlobalDirectories,
		extraDirectories = [],
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
		extraDirectories,
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
	{ osName = os.platform(), env = process.env, killTree = spawnSync } = {},
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
			// Fall through to the direct child.
		}
	}
	if (osName !== "win32" && child.pid) {
		try {
			process.kill(-child.pid, signal);
			return true;
		} catch {
			// Fall through when the child has no process group.
		}
	}
	try {
		return child.kill(signal);
	} catch {
		return false;
	}
}
