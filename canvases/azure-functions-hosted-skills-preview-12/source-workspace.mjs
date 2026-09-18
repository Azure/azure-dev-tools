import { createHash, randomUUID } from "node:crypto";
import { cp, link, lstat, mkdir, open, readFile, readdir, readlink, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { STATE_COMPONENT, STATE_PRODUCT, LEGACY_STATE_COMPONENT, atomicStateWrite, migrateStateRecord, assertSafeStatePath } from "./state-migration.mjs";

export const DEFAULT_CURRENT_SUBDIR = path.join("functions", "daily-repo-digest");
const MANIFEST_VERSION = 2;
const SUPPORTED_MANIFEST_VERSIONS = new Set([1, MANIFEST_VERSION]);
const OWNERSHIP_MARKER_RELATIVE_PATH = path.join(
	`.${STATE_PRODUCT}`,
	"source-workspace-ownership.json",
);
const LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH = path.join(`.${LEGACY_STATE_COMPONENT}`, "source-workspace-ownership.json");
const RUNTIME_DIRS = new Set([
	".azurite",
	".azure",
	".git",
	".intelligent-function-app-studio",
	".azure-functions-hosted-skills-preview-12",
	".mypy_cache",
	".pytest_cache",
	".python_packages",
	".venv",
	"__pycache__",
]);

async function pathExists(filePath) {
	try {
		await lstat(filePath);
		return true;
	} catch (error) {
		if (error?.code === "ENOENT") return false;
		throw error;
	}
}

function normalizedRelativePath(relativePath) {
	const raw = String(relativePath || "").trim();
	if (!raw || path.isAbsolute(raw) || path.win32.isAbsolute(raw) || /^[A-Za-z]:/.test(raw)) throw new Error("Choose a non-empty relative folder inside the current worktree.");
	if (raw.split(/[\\/]/).includes("..")) throw new Error("The generated app folder must stay inside the current worktree.");
	const normalized = path.normalize(raw);
	if (normalized === ".") throw new Error("The generated app folder must be a dedicated subfolder inside the current worktree.");
	if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
		throw new Error("The generated app folder must stay inside the current worktree.");
	}
	return normalized;
}

export function resolveCurrentWorkspaceDestination(workingDirectory, relativePath = DEFAULT_CURRENT_SUBDIR) {
	if (!workingDirectory || !path.isAbsolute(workingDirectory)) {
		throw new Error("The current chat does not expose an absolute worktree path. Use an isolated workspace instead.");
	}
	const root = path.resolve(workingDirectory);
	const relative = normalizedRelativePath(relativePath);
	const destination = path.resolve(root, relative);
	const fromRoot = path.relative(root, destination);
	if (!fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
		throw new Error("The generated app folder must be a dedicated subfolder inside the current worktree.");
	}
	return { root, relative, destination };
}

export async function assertCurrentWorkspaceDestinationSafe(
	workingDirectory,
	relativePath = DEFAULT_CURRENT_SUBDIR,
) {
	const selected = resolveCurrentWorkspaceDestination(workingDirectory, relativePath);
	let cursor = selected.root;
	for (const segment of selected.relative.split(path.sep)) {
		cursor = path.join(cursor, segment);
		try {
			const stat = await lstat(cursor);
			if (stat.isSymbolicLink()) {
				throw new Error(`The generated app path cannot traverse a symbolic link: ${cursor}`);
			}
			if (cursor !== selected.destination && !stat.isDirectory()) {
				throw new Error(`The generated app parent path is not a directory: ${cursor}`);
			}
		} catch (error) {
			if (error?.code === "ENOENT") break;
			throw error;
		}
	}
	return selected;
}

export function sourceManifestPath(copilotHome, sessionId, instanceId, { legacy = false, pathApi = path } = {}) {
	const key = createHash("sha256")
		.update(`${String(sessionId || "unknown")}\0${String(instanceId || "unknown")}`)
		.digest("hex")
		.slice(0, 24);
	return pathApi.join(copilotHome, "extensions", legacy ? LEGACY_STATE_COMPONENT : STATE_COMPONENT, "artifacts", "source-workspaces", `${key}.json`);
}

function ignoredRuntimePath(relativePath) {
	const parts = relativePath.split(path.sep);
	const base = parts.at(-1) || "";
	return (
		parts.some((part) => RUNTIME_DIRS.has(part)) ||
		base === ".DS_Store" ||
		base === "local.settings.json" ||
		base.endsWith(".pyc")
	);
}

async function fileDigest(filePath) {
	const bytes = await readFile(filePath);
	return createHash("sha256").update(bytes).digest("hex");
}

async function readWorkspaceIdentityMarker(root, relativePath = OWNERSHIP_MARKER_RELATIVE_PATH) {
	const resolvedRoot = path.resolve(root);
	const markerPath = path.join(resolvedRoot, relativePath);
	await assertSafeStatePath(markerPath);
	let cursor = resolvedRoot;
	for (const part of relativePath.split(path.sep)) {
		cursor = path.join(cursor, part);
		let item;
		try {
			item = await lstat(cursor);
		} catch (error) {
			if (error?.code === "ENOENT") return null;
			throw error;
		}
		if (item.isSymbolicLink()) {
			throw new Error("Generated workspace ownership marker cannot traverse a symbolic link.");
		}
	}
	const marker = JSON.parse(await readFile(markerPath, "utf8"));
	if (
		marker?.version !== 1 ||
		typeof marker.templateId !== "string" ||
		!marker.templateId ||
		typeof marker.generationId !== "string" ||
		!marker.generationId ||
		(relativePath === OWNERSHIP_MARKER_RELATIVE_PATH && marker.component !== STATE_COMPONENT)
	) {
		throw new Error("Generated workspace ownership marker is invalid.");
	}
	return marker;
}

async function writeWorkspaceIdentityMarker(root, { templateId, generationId }, relativePath = OWNERSHIP_MARKER_RELATIVE_PATH) {
	const resolvedRoot = path.resolve(root);
	const existing = await readWorkspaceIdentityMarker(root, relativePath);
	if (existing) {
		if (existing.templateId !== templateId || existing.generationId !== generationId) {
			throw new Error("Refusing to overwrite a divergent workspace ownership marker.");
		}
		return existing;
	}
	const markerDir = path.join(resolvedRoot, path.dirname(relativePath));
	try {
		const item = await lstat(markerDir);
		if (item.isSymbolicLink() || !item.isDirectory()) {
			throw new Error("Generated workspace ownership marker directory is unsafe.");
		}
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
		await mkdir(markerDir, { recursive: true, mode: 0o700 });
	}
	const markerPath = path.join(resolvedRoot, relativePath);
	const marker = {
		version: 1,
		...(relativePath === OWNERSHIP_MARKER_RELATIVE_PATH ? { component: STATE_COMPONENT } : {}),
		templateId: String(templateId || ""),
		generationId: String(generationId || ""),
	};
	if (!marker.templateId || !marker.generationId) {
		throw new Error("Generated workspace ownership marker requires a template and generation.");
	}
	await atomicStateWrite(markerPath, `${JSON.stringify(marker, null, 2)}\n`);
	return marker;
}

export async function assertWorkspaceIdentity(root, manifest, { upgrade = true } = {}) {
	const canonical = await readWorkspaceIdentityMarker(root);
	const legacy = await readWorkspaceIdentityMarker(root, LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH);
	const marker = canonical || legacy;
	if (!marker) {
		throw new Error("The Studio-owned workspace identity marker is missing.");
	}
	if (marker.templateId !== manifest.templateId || marker.generationId !== manifest.generationId) {
		throw new Error("The folder at this path is not the Studio-owned workspace recorded by the ownership manifest.");
	}
	if (legacy && (legacy.templateId !== marker.templateId || legacy.generationId !== marker.generationId)) {
		throw new Error("Canonical and legacy workspace ownership markers disagree.");
	}
	if (!canonical && upgrade) await writeWorkspaceIdentityMarker(root, manifest);
	return marker;
}

export async function snapshotWorkspaceTree(root, { ignoreRuntime = true } = {}) {
	const absoluteRoot = path.resolve(root);
	const entries = [];

	async function visit(directory, relativeDirectory = "") {
		const children = await readdir(directory, { withFileTypes: true });
		children.sort((a, b) => a.name.localeCompare(b.name));
		for (const child of children) {
			const relativePath = path.join(relativeDirectory, child.name);
			if (ignoreRuntime && ignoredRuntimePath(relativePath)) continue;
			const absolutePath = path.join(directory, child.name);
			if (child.isDirectory()) {
				await visit(absolutePath, relativePath);
			} else if (child.isSymbolicLink()) {
				entries.push({ path: relativePath, type: "symlink", target: await readlink(absolutePath) });
			} else if (child.isFile()) {
				const stat = await lstat(absolutePath);
				entries.push({ path: relativePath, type: "file", size: stat.size, sha256: await fileDigest(absolutePath) });
			} else {
				throw new Error(`Unsupported generated workspace entry: ${relativePath}`);
			}
		}
	}

	if (await pathExists(absoluteRoot)) await visit(absoluteRoot);
	return entries;
}

export async function createOwnershipManifest({
	root,
	workspaceRoot,
	relativePath,
	sessionId,
	instanceId,
	templateId = "",
	baselineRoot = root,
	removalPolicy = "baseline",
	state = "ready",
	generationId = randomUUID(),
}) {
	const resolvedRoot = path.resolve(root);
	const resolvedWorkspace = path.resolve(workspaceRoot);
	const safe = resolveCurrentWorkspaceDestination(resolvedWorkspace, relativePath);
	if (safe.destination !== resolvedRoot) throw new Error("Generated workspace ownership does not match its declared worktree path.");
	if (!["baseline", "preserve"].includes(removalPolicy)) {
		throw new Error("Generated workspace ownership has an invalid removal policy.");
	}
	if (!["pending", "ready", "moving"].includes(state)) {
		throw new Error("Generated workspace ownership has an invalid state.");
	}
	const normalizedTemplateId = String(templateId || "");
	const normalizedGenerationId = String(generationId || "");
	if (!normalizedTemplateId || !normalizedGenerationId) {
		throw new Error("Generated workspace ownership requires a template and generation.");
	}
	await writeWorkspaceIdentityMarker(path.resolve(baselineRoot), {
		templateId: normalizedTemplateId,
		generationId: normalizedGenerationId,
	});
	await writeWorkspaceIdentityMarker(path.resolve(baselineRoot), {
		templateId: normalizedTemplateId,
		generationId: normalizedGenerationId,
	}, LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH);
	return {
		version: MANIFEST_VERSION,
		root: resolvedRoot,
		workspaceRoot: resolvedWorkspace,
		relativePath: safe.relative,
		sessionId: String(sessionId || ""),
		instanceId: String(instanceId || ""),
		templateId: normalizedTemplateId,
		generationId: normalizedGenerationId,
		removalPolicy,
		state,
		createdAt: new Date().toISOString(),
		baseline: await snapshotWorkspaceTree(path.resolve(baselineRoot)),
	};
}

export async function writeOwnershipManifest(filePath, manifest) {
	await atomicStateWrite(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export async function readOwnershipManifest(filePath) {
	try {
		await assertSafeStatePath(filePath);
		const manifest = JSON.parse(await readFile(filePath, "utf8"));
		return validateOwnershipManifest(manifest);
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		throw error;
	}
}

export function validateOwnershipManifest(manifest) {
		for (const key of ["root", "workspaceRoot", "relativePath", "sessionId", "instanceId", "templateId", "generationId", "createdAt"]) {
			if (manifest?.[key] !== undefined && typeof manifest[key] !== "string") {
				throw new Error("Generated workspace ownership manifest is invalid.");
			}
		}
		const invalidMove =
			manifest?.state === "moving" &&
			(!["current", "isolated"].includes(manifest.move?.mode) ||
				typeof manifest.move?.sourceRoot !== "string" ||
				!manifest.move.sourceRoot ||
				typeof manifest.move?.destinationRoot !== "string" ||
				!manifest.move.destinationRoot ||
				(manifest.move.mode === "current" &&
					(typeof manifest.move?.relativePath !== "string" || !manifest.move.relativePath)));
		const invalidV2 =
			manifest?.version === MANIFEST_VERSION &&
			(typeof manifest.templateId !== "string" ||
				!manifest.templateId ||
				typeof manifest.generationId !== "string" ||
				!manifest.generationId ||
				!["baseline", "preserve"].includes(manifest.removalPolicy) ||
				!["pending", "ready", "moving"].includes(manifest.state) ||
				invalidMove);
		if (
			!SUPPORTED_MANIFEST_VERSIONS.has(manifest?.version) ||
			!manifest.root ||
			!manifest.workspaceRoot ||
			!manifest.relativePath ||
			!Array.isArray(manifest.baseline) ||
			invalidV2 ||
			(manifest.removalPolicy && !["baseline", "preserve"].includes(manifest.removalPolicy)) ||
			(manifest.state && !["pending", "ready", "moving"].includes(manifest.state))
		) {
			throw new Error("Generated workspace ownership manifest is invalid.");
		}
		const selected = resolveCurrentWorkspaceDestination(manifest.workspaceRoot, manifest.relativePath);
		if (!path.isAbsolute(manifest.root) || selected.destination !== path.resolve(manifest.root)) {
			throw new Error("Generated workspace ownership does not match its worktree path.");
		}
		for (const entry of manifest.baseline) {
			normalizedRelativePath(entry?.path);
			if (!["file", "symlink"].includes(entry?.type) ||
				(entry.type === "file" && (!Number.isSafeInteger(entry.size) || entry.size < 0 || !/^[a-f0-9]{64}$/.test(entry.sha256))) ||
				(entry.type === "symlink" && typeof entry.target !== "string")) {
				throw new Error("Generated workspace ownership baseline is invalid.");
			}
		}
		return manifest;
}

export async function migrateSourceOwnership({
	destination, sources, workspaceRoot, sessionId, instanceId, templateId, lockHeld = false,
}) {
	const owner = workspaceRoot
		? { component: STATE_COMPONENT, workspaceRoot: path.resolve(workspaceRoot) }
		: { component: STATE_COMPONENT, sessionId: String(sessionId || ""), instanceId: String(instanceId || "") };
	const allowedDirectories = new Set(sources.map((file) => path.dirname(file)));
	const isSourceAllowed = (file) => typeof file === "string" && allowedDirectories.has(path.dirname(file)) &&
		/^[a-f0-9]{24}\.json$/.test(path.basename(file));
	const removed = await migrateStateRecord({
		destination: `${destination}.removed`, sources: sources.map((file) => `${file}.removed`),
		schema: "studio.source-workspace-removal.v1", owner, lockHeld,
		isSourceAllowed: (file) => typeof file === "string" && file.endsWith(".removed") && isSourceAllowed(file.slice(0, -8)),
		decode: (value) => value, encode: (value) => value,
		validate(value) {
			if (value !== "Removed by the user. Create from the Studio to restore.\n") {
				throw new Error("Invalid legacy workspace removal record.");
			}
			return value;
		},
	});
	const result = await migrateStateRecord({
		destination, sources, schema: "studio.source-workspace.v2", owner, lockHeld,
		isSourceAllowed,
		async validate(value, { canonical }) {
			const manifest = validateOwnershipManifest(value);
			if ((workspaceRoot && path.resolve(manifest.workspaceRoot) !== path.resolve(workspaceRoot)) ||
				(!workspaceRoot && (manifest.sessionId !== sessionId || manifest.instanceId !== instanceId)) ||
				(manifest.templateId && manifest.templateId !== templateId)) {
				throw new Error("Legacy source manifest ownership does not match this worktree, instance, or template.");
			}
			if (!canonical) {
				if (manifest.state === "moving") throw new Error("Legacy workspace has an unfinished move; reconcile it before migrating ownership.");
				if (!(removed && !(await pathExists(manifest.root)))) {
					await assertCurrentWorkspaceDestinationSafe(manifest.workspaceRoot, manifest.relativePath);
					if (!(await pathExists(manifest.root))) throw new Error("Legacy owned workspace is missing; migration was not performed.");
					if (manifest.version === 1 || manifest.state === "pending") {
						if ((await verifyOwnedWorkspace(manifest.root, manifest)).length) {
							throw new Error("Legacy ownership baseline does not match; migration cannot safely upgrade it.");
						}
					}
					if (manifest.version !== 1) await assertWorkspaceIdentity(manifest.root, manifest, { upgrade: false });
				}
			}
			const projected = Object.fromEntries(["version", "root", "workspaceRoot", "relativePath", "sessionId", "instanceId", "templateId", "generationId", "removalPolicy", "state", "createdAt", "baseline", "move"]
				.filter((key) => Object.hasOwn(manifest, key)).map((key) => [key, manifest[key]]));
			projected.baseline = manifest.baseline.map((entry) => entry.type === "file"
				? { path: entry.path, type: entry.type, size: entry.size, sha256: entry.sha256 }
				: { path: entry.path, type: entry.type, target: entry.target });
			if (manifest.move) projected.move = Object.fromEntries(["mode", "sourceRoot", "destinationRoot", "relativePath"]
				.filter((key) => Object.hasOwn(manifest.move, key)).map((key) => [key, manifest.move[key]]));
			return projected;
		},
	});
	return result?.value ?? null;
}

export async function validateRuntimeWorkspace(root, recoverySignatures, templateId) {
	await assertSafeStatePath(root);
	const marker = await readWorkspaceIdentityMarker(root) || await readWorkspaceIdentityMarker(root, LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH);
	if (marker) {
		if (marker.templateId !== templateId) throw new Error("Retained runtime workspace belongs to another template.");
		await assertWorkspaceIdentity(root, marker);
		return;
	}
	for (const signature of recoverySignatures) {
		await assertRecoverySignature(root, signature);
	}
	if (templateId) {
		const identity = { templateId, generationId: randomUUID() };
		await writeWorkspaceIdentityMarker(root, identity);
		await writeWorkspaceIdentityMarker(root, identity, LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH);
	}
}

async function assertRecoverySignature(root, signature) {
	const relative = normalizedRelativePath(signature?.path);
	const resolvedRoot = path.resolve(root);
	const absolute = path.resolve(resolvedRoot, relative);
	const fromRoot = path.relative(resolvedRoot, absolute);
	if (!fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
		throw new Error("Generated workspace recovery signatures must stay inside the destination.");
	}
	let cursor = resolvedRoot;
	const parts = relative.split(path.sep);
	for (const [index, part] of parts.entries()) {
		cursor = path.join(cursor, part);
		let item;
		try {
			item = await lstat(cursor);
		} catch (error) {
			if (error?.code === "ENOENT") {
				throw new Error(`The existing destination is not a verified Studio-owned workspace: missing ${relative}.`);
			}
			throw error;
		}
		if (item.isSymbolicLink()) {
			throw new Error(`The existing destination is not a verified Studio-owned workspace: ${relative} traverses a symbolic link.`);
		}
		if (index < parts.length - 1 && !item.isDirectory()) {
			throw new Error(`The existing destination is not a verified Studio-owned workspace: ${relative} has an invalid parent.`);
		}
		if (index === parts.length - 1 && !item.isFile()) {
			throw new Error(`The existing destination is not a verified Studio-owned workspace: ${relative} is not a file.`);
		}
	}
	let content;
	try {
		content = await readFile(absolute, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") {
			throw new Error(`The existing destination is not a verified Studio-owned workspace: missing ${relative}.`);
		}
		throw error;
	}
	for (const marker of signature.includes || []) {
		if (!content.includes(marker)) {
			throw new Error(`The existing destination is not a verified Studio-owned workspace: ${relative} has no ${marker} marker.`);
		}
	}
}

export async function reenterOwnedWorkspace({
	workspaceRoot,
	relativePath,
	manifest,
	sessionId,
	instanceId,
	templateId,
	recoverySignatures = [],
}) {
	const selected = await assertCurrentWorkspaceDestinationSafe(workspaceRoot, relativePath);
	let stat;
	try {
		stat = await lstat(selected.destination);
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		throw error;
	}
	if (!stat.isDirectory()) {
		throw new Error(`The current-worktree destination is not a directory: ${selected.destination}`);
	}

	if (manifest) {
		if (manifest.state === "moving") {
			throw new Error("The generated workspace has an unfinished move that must be reconciled before reentry.");
		}
		if (
			path.resolve(manifest.root) !== selected.destination ||
			path.resolve(manifest.workspaceRoot) !== selected.root ||
			path.normalize(manifest.relativePath) !== selected.relative
		) {
			throw new Error("Generated workspace ownership does not match the selected worktree destination.");
		}
		if (manifest.templateId && manifest.templateId !== templateId) {
			throw new Error("The existing destination belongs to a different Studio-generated template.");
		}
		if (manifest.version === 1 || manifest.state === "pending") {
			const conflicts = await verifyOwnedWorkspace(selected.destination, manifest);
			if (conflicts.length) {
				throw new Error(
					manifest.version === 1
						? "The legacy generated workspace changed after creation and cannot be upgraded safely."
						: "The pending generated workspace does not match its recorded creation baseline.",
				);
			}
		}
		const previousIdentity = manifest.version === 1
			? await readWorkspaceIdentityMarker(selected.destination) || await readWorkspaceIdentityMarker(selected.destination, LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH)
			: null;
		if (previousIdentity && previousIdentity.templateId !== templateId) {
			throw new Error("Legacy workspace identity belongs to another template.");
		}
		const generationId = manifest.generationId || previousIdentity?.generationId || randomUUID();
		const upgraded = {
			...manifest,
			version: MANIFEST_VERSION,
			templateId,
			generationId,
			removalPolicy: manifest.removalPolicy || "baseline",
			state: "ready",
		};
		if (manifest.version === 1) {
			await writeWorkspaceIdentityMarker(selected.destination, upgraded);
			await writeWorkspaceIdentityMarker(selected.destination, upgraded, LEGACY_OWNERSHIP_MARKER_RELATIVE_PATH);
		} else {
			await assertWorkspaceIdentity(selected.destination, upgraded);
		}
		return {
			...selected,
			manifest: upgraded,
			recovered: false,
			manifestChanged: JSON.stringify(upgraded) !== JSON.stringify(manifest),
		};
	}

	if (!recoverySignatures.length) {
		throw new Error(`The current-worktree destination already exists and is not Studio-owned: ${selected.destination}`);
	}
	for (const signature of recoverySignatures) {
		await assertRecoverySignature(selected.destination, signature);
	}
	const recoveredManifest = await createOwnershipManifest({
		root: selected.destination,
		workspaceRoot: selected.root,
		relativePath: selected.relative,
		sessionId,
		instanceId,
		templateId,
		removalPolicy: "preserve",
	});
	return {
		...selected,
		manifest: recoveredManifest,
		recovered: true,
		manifestChanged: true,
	};
}

export async function acquireOwnershipLock(
	manifestPath,
	{ timeoutMs = 120000, pollMs = 50, staleMs = 10 * 60 * 1000 } = {},
) {
	const lockPath = `${manifestPath}.lock`;
	await assertSafeStatePath(manifestPath);
	await assertSafeStatePath(lockPath);
	await mkdir(path.dirname(lockPath), { recursive: true, mode: 0o700 });
	const started = Date.now();
	const token = randomUUID();
	while (true) {
		try {
			const handle = await open(lockPath, "wx", 0o600);
			await handle.writeFile(`${JSON.stringify({ pid: process.pid, token, createdAt: new Date().toISOString() })}\n`);
			let released = false;
			return async () => {
				if (released) return;
				released = true;
				await handle.close();
				let current = null;
				try {
					current = JSON.parse(await readFile(lockPath, "utf8"));
				} catch (error) {
					if (error?.code !== "ENOENT") throw error;
				}
				if (current?.token === token) await rm(lockPath, { force: true });
			};
		} catch (error) {
			if (error?.code !== "EEXIST") throw error;
			try {
				const lockStat = await stat(lockPath);
				let currentRaw = "";
				let current = null;
				try {
					currentRaw = await readFile(lockPath, "utf8");
					current = JSON.parse(currentRaw);
				} catch {
					/* An incomplete lock is removable only after the stale interval. */
				}
				let ownerAlive = false;
				if (Number.isInteger(current?.pid) && current.pid > 0) {
					try {
						process.kill(current.pid, 0);
						ownerAlive = true;
					} catch (ownerError) {
						ownerAlive = ownerError?.code === "EPERM";
					}
				}
				const ownerKnown = Number.isInteger(current?.pid) && current.pid > 0;
				const stale = (!ownerAlive && ownerKnown) || (!ownerKnown && Date.now() - lockStat.mtimeMs > staleMs);
				if (stale) {
					const observed = currentRaw || `invalid:${lockStat.size}:${lockStat.mtimeMs}`;
					const observedHash = createHash("sha256").update(observed).digest("hex").slice(0, 16);
					const takeoverPath = `${lockPath}.takeover-${observedHash}-${token}`;
					try {
						await link(lockPath, takeoverPath);
						const [latestLockStat, takeoverStat] = await Promise.all([stat(lockPath), stat(takeoverPath)]);
						if (
							lockStat.dev === takeoverStat.dev &&
							lockStat.ino === takeoverStat.ino &&
							latestLockStat.dev === takeoverStat.dev &&
							latestLockStat.ino === takeoverStat.ino
						) {
							await rm(lockPath, { force: true });
						}
					} catch (takeoverError) {
						if (!["EEXIST", "ENOENT"].includes(takeoverError?.code)) throw takeoverError;
					} finally {
						await rm(takeoverPath, { force: true });
					}
				}
			} catch (statError) {
				if (statError?.code !== "ENOENT") throw statError;
			}
			if (Date.now() - started >= timeoutMs) {
				throw new Error("Timed out waiting for another Studio instance to finish creating this workspace.");
			}
			await new Promise((resolve) => setTimeout(resolve, pollMs));
		}
	}
}

export async function verifyOwnedWorkspace(root, manifest) {
	const resolvedRoot = path.resolve(root);
	if (path.resolve(manifest?.root || "") !== resolvedRoot) {
		throw new Error("Generated workspace ownership manifest does not match this folder.");
	}
	const baseline = new Map(manifest.baseline.map((entry) => [entry.path, entry]));
	const currentEntries = await snapshotWorkspaceTree(resolvedRoot);
	const current = new Map(currentEntries.map((entry) => [entry.path, entry]));
	const conflicts = [];
	for (const [relativePath, expected] of baseline) {
		const actual = current.get(relativePath);
		if (!actual) {
			conflicts.push({ path: relativePath, reason: "missing" });
		} else if (JSON.stringify(actual) !== JSON.stringify(expected)) {
			conflicts.push({ path: relativePath, reason: "modified" });
		}
	}
	for (const relativePath of current.keys()) {
		if (!baseline.has(relativePath)) conflicts.push({ path: relativePath, reason: "added" });
	}
	return conflicts;
}

export async function removeOwnedWorkspace(root, manifest) {
	const resolvedRoot = path.resolve(root);
	const safe = resolveCurrentWorkspaceDestination(manifest.workspaceRoot, manifest.relativePath);
	if (safe.destination !== resolvedRoot || path.resolve(manifest.root) !== resolvedRoot) {
		throw new Error("Refusing to remove a folder outside the recorded generated workspace.");
	}
	if (manifest.removalPolicy === "preserve") {
		throw new Error(
			"This workspace was recovered without its original creation baseline, so Studio will not remove it automatically.",
		);
	}
	await assertWorkspaceIdentity(resolvedRoot, manifest);
	const conflicts = await verifyOwnedWorkspace(resolvedRoot, manifest);
	if (conflicts.length) {
		const summary = conflicts
			.slice(0, 5)
			.map((item) => `${item.path} (${item.reason})`)
			.join(", ");
		throw new Error(
			`Generated files changed after creation, so nothing was removed. Move the app to an isolated session or review: ${summary}${conflicts.length > 5 ? ` and ${conflicts.length - 5} more` : ""}.`,
		);
	}
	await rm(resolvedRoot, { recursive: true, force: false });
}

export async function moveWorkspaceDirectory(source, destination) {
	const resolvedSource = path.resolve(source);
	const resolvedDestination = path.resolve(destination);
	if (resolvedSource === resolvedDestination) return;
	if (!(await pathExists(resolvedSource))) throw new Error("The generated workspace no longer exists.");
	if (await pathExists(resolvedDestination)) throw new Error(`The isolated destination already exists: ${resolvedDestination}`);
	await mkdir(path.dirname(resolvedDestination), { recursive: true });
	try {
		await rename(resolvedSource, resolvedDestination);
	} catch (error) {
		if (error?.code !== "EXDEV") throw error;
		const before = await snapshotWorkspaceTree(resolvedSource, { ignoreRuntime: false });
		await cp(resolvedSource, resolvedDestination, { recursive: true, errorOnExist: true, force: false });
		const after = await snapshotWorkspaceTree(resolvedDestination, { ignoreRuntime: false });
		if (JSON.stringify(after) !== JSON.stringify(before)) {
			await rm(resolvedDestination, { recursive: true, force: true });
			throw new Error("The isolated copy could not be verified, so the current-worktree source was left unchanged.");
		}
		await rm(resolvedSource, { recursive: true, force: false });
	}
}

export async function deleteOwnershipManifest(filePath) {
	await rm(filePath, { force: true });
}
