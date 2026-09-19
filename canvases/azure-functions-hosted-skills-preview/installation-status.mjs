import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import { PRODUCT_ID, COMPONENT_ID, LEGACY_PLUGIN_ID } from "./canvas-identity.mjs";

const identities = new Set([PRODUCT_ID, LEGACY_PLUGIN_ID]);

/** @typedef {{ copilotHome?: string, projectRoot?: string }} InstallationStatusOptions */

async function optional(operation) {
	try {
		return await operation();
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
		throw error;
	}
}

// Read manifests, not extension code or user artifacts. No installs or repairs.
/** @param {InstallationStatusOptions} [options] */
export async function installationStatus({
	copilotHome = process.env.COPILOT_HOME || path.join(homedir(), ".copilot"),
	projectRoot,
} = {}) {
	const found = new Map();
	async function inspect(directory, inferredId) {
		const entry = await optional(() => lstat(path.join(directory, "extension.mjs")));
		if (!entry?.isFile() && !entry?.isSymbolicLink()) return;
		const manifestText = await optional(() => readFile(path.join(directory, ".github/plugin/plugin.json"), "utf8"));
		const id = manifestText ? JSON.parse(manifestText).name : inferredId;
		if (!identities.has(id)) return;
		const resolved = await realpath(directory);
		found.set(`${id}:${resolved}`, { pluginId: id, canvasId: id === PRODUCT_ID ? COMPONENT_ID : id, path: resolved });
	}
	for (const root of [path.join(copilotHome, "extensions"), projectRoot && path.join(projectRoot, ".github/extensions")].filter(Boolean)) {
		for (const id of identities) await inspect(path.join(root, id), id);
	}
	async function scan(directory, depth) {
		if (depth > 4) return;
		await inspect(directory);
		const entries = await optional(() => readdir(directory, { withFileTypes: true }));
		for (const entry of entries || []) {
			if (!entry.isDirectory() || entry.name.startsWith(".") || ["node_modules", "artifacts", "canvases", "skills"].includes(entry.name)) continue;
			await scan(path.join(directory, entry.name), depth + 1);
		}
	}
	await scan(path.join(copilotHome, "installed-plugins"), 0);
	const installations = [...found.values()];
	const mixedIdentities = new Set(installations.map((entry) => entry.pluginId)).size > 1;
	const retiredOnly = installations.length > 0 && installations.every((entry) => entry.pluginId === LEGACY_PLUGIN_ID);
	const duplicate = installations.length > 1;
	return {
		installations,
		duplicate,
		message: mixedIdentities
			? "Both Azure Functions Hosted Skills Preview and a retired legacy installation are present. Only azure-functions-hosted-skills ships now; old folder install URLs no longer work. Close the old panel and disable its registration through the host before reinstalling canonical. Preserve legacy state and generated apps; no install or state was changed."
			: retiredOnly
				? "Only a retired legacy installation was found. Old folder install URLs no longer work. Close its panel and review the registration before installing azure-functions-hosted-skills; preserve legacy state and generated apps."
			: duplicate
				? `Multiple installations advertise ${installations[0].canvasId}. Select the intended provider with extensionId and disable the other installation using your host's controls. No install or state was changed.`
			: "Only one product identity (or no filesystem-visible install) was found. Host-managed or remote installs may not be visible here; use the host's plugin list to confirm.",
	};
}
