import path from "node:path";

export function pythonVirtualEnvironment(agentDir, platform = process.platform) {
	const pathApi = platform === "win32" ? path.win32 : path.posix;
	const directory = pathApi.join(agentDir, ".venv");
	const binDirectory = pathApi.join(directory, platform === "win32" ? "Scripts" : "bin");
	return {
		directory,
		binDirectory,
		python: pathApi.join(binDirectory, platform === "win32" ? "python.exe" : "python3"),
		marker: pathApi.join(directory, ".copilot-installed"),
	};
}

export function pythonVirtualEnvironmentEnv(agentDir, env = process.env, platform = process.platform) {
	const venv = pythonVirtualEnvironment(agentDir, platform);
	const inheritedPath = env.PATH || env.Path || "";
	return {
		...env,
		VIRTUAL_ENV: venv.directory,
		UV_PROJECT_ENVIRONMENT: venv.directory,
		PATH: [venv.binDirectory, inheritedPath].filter(Boolean).join(platform === "win32" ? ";" : ":"),
	};
}

export function classifyPythonVirtualEnvironment({ directoryExists, interpreterExists, interpreterValid }) {
	if (!directoryExists) return "absent";
	if (!interpreterExists) return "partial";
	return interpreterValid ? "ready" : "stale";
}
