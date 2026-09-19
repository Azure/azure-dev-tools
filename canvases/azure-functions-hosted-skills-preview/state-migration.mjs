import { createHash, randomUUID } from "node:crypto";
import { link, lstat, mkdir, open, readFile, realpath, rename, rm } from "node:fs/promises";
import path from "node:path";
import { homedir, tmpdir } from "node:os";
import { acquireStateLock } from "./state-lock.mjs";

// Deliberately independent of the installable distribution's CANVAS_ID.
export const STATE_COMPONENT = "azure-functions-hosted-skills-preview";
export const STATE_PRODUCT = "azure-functions-hosted-skills-preview";
export const LEGACY_STATE_COMPONENT = "intelligent-function-app-studio";

export function studioStateEnvironment({ env = process.env, homeDirectory = homedir, pathApi = path } = {}) {
	const override = env.FUNCTION_STUDIO_STATE_HOME;
	if (override !== undefined && (!override || !pathApi.isAbsolute(override))) {
		throw new Error("FUNCTION_STUDIO_STATE_HOME must be an absolute fixture/state home directory.");
	}
	const home = override || homeDirectory();
	return {
		home,
		// An explicit state-home fence includes ownership records. Do not let an
		// inherited COPILOT_HOME escape it into the user's real extension state.
		copilotHome: override ? pathApi.join(home, ".copilot") : env.COPILOT_HOME || pathApi.join(home, ".copilot"),
	};
}

export function stateDigest(value) {
	return createHash("sha256").update(value).digest("hex");
}

export function instanceStateSegment(instanceId) {
	const value = String(instanceId || "instance");
	const safe = value.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80);
	if (safe === value && safe !== "." && safe !== ".." && !safe.endsWith(".") &&
		!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe)) return safe;
	return `instance-${stateDigest(value).slice(0, 32)}`;
}

export function studioStatePaths({ home, copilotHome, instanceId, pathApi = path } = {}) {
	if (home === undefined) {
		const environment = studioStateEnvironment({ pathApi });
		home = environment.home;
		copilotHome ??= environment.copilotHome;
	}
	copilotHome ??= pathApi.join(home, ".copilot");
	const segment = instanceStateSegment(instanceId);
	const raw = String(instanceId || "instance");
	const legacySegment = raw.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80) || "instance";
	// Old sanitization was lossy, so a changed/truncated ID cannot prove ownership.
	const legacyRoots = segment === legacySegment ? [
		pathApi.join(home, `.${LEGACY_STATE_COMPONENT}`, legacySegment),
		pathApi.join(copilotHome, "extensions", LEGACY_STATE_COMPONENT, "state", legacySegment),
		pathApi.join(copilotHome, "extensions", LEGACY_STATE_COMPONENT, "artifacts", legacySegment),
	] : [];
	return {
		home,
		copilotHome,
		root: pathApi.join(home, `.${STATE_PRODUCT}`, STATE_COMPONENT, segment),
		legacyRoots,
		ambiguousLegacyRoot: segment !== legacySegment && ![".", ".."].includes(legacySegment)
			? pathApi.join(home, `.${LEGACY_STATE_COMPONENT}`, legacySegment) : null,
		owner: { component: STATE_COMPONENT, instanceId: raw },
	};
}

export async function assertSafeStatePath(file, { trustedRoot } = {}) {
	const resolved = path.resolve(file);
	const contains = (root) => {
		const relative = path.relative(root, resolved);
		return !path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`);
	};
	const base = trustedRoot ? path.resolve(trustedRoot) : [
		studioStateEnvironment().home, homedir(), tmpdir(), process.cwd(),
	].map((root) => path.resolve(root)).filter(contains).sort((a, b) => b.length - a.length)[0] || path.parse(resolved).root;
	if (!contains(base)) throw new Error(`State path is outside its trusted base: ${file}`);
	let cursor;
	try {
		// The caller/environment supplies the trusted base. Its OS-managed
		// ancestry may contain aliases such as macOS /var -> /private/var.
		// Never realpath the owned descendants: each must be checked with lstat.
		cursor = await realpath(base);
	} catch (error) {
		if (error?.code === "ENOENT") return;
		throw error;
	}
	const relative = path.relative(base, resolved);
	const physicalFile = path.join(cursor, relative);
	const parts = relative ? relative.split(path.sep) : [""];
	for (const part of parts) {
		cursor = path.join(cursor, part);
		try {
			const item = await lstat(cursor);
			if (item.isSymbolicLink()) throw new Error(`State ownership rejected a symbolic link: ${cursor}`);
			if (cursor === physicalFile && typeof process.getuid === "function" && item.uid !== process.getuid()) {
				throw new Error(`State ownership rejected a file owned by another user: ${cursor}`);
			}
		} catch (error) {
			if (error?.code === "ENOENT") return;
			throw error;
		}
	}
}

export async function readStateText(file) {
	await assertSafeStatePath(file);
	try {
		const item = await lstat(file);
		if (!item.isFile() || item.size > 8 * 1024 * 1024) throw new Error(`Invalid or oversized state file: ${file}`);
		return await readFile(file, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		throw error;
	}
}

export async function atomicStateWrite(file, value, { exclusive = false } = {}) {
	await assertSafeStatePath(file);
	await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
	const temporary = `${file}.${randomUUID()}.pending`;
	const handle = await open(temporary, "wx", 0o600);
	try {
		await handle.writeFile(value);
		await handle.sync();
		await handle.close();
		if (exclusive) await link(temporary, file);
		else await rename(temporary, file);
	} finally {
		await handle.close();
		await rm(temporary, { force: true });
	}
}

export async function withStateLock(file, callback) {
	await assertSafeStatePath(file);
	await assertSafeStatePath(`${file}.lock`);
	const release = await acquireStateLock(file);
	try {
		return await callback();
	} finally {
		await release();
	}
}

const jsonText = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sameOwner = (left, right) => JSON.stringify(left) === JSON.stringify(right);

/**
 * Copy one understood record, never a directory. A durable intent precedes the
 * exclusive publication; a retry can finish the receipt without recopying data.
 * Callers holding the canonical ownership lock must pass lockHeld.
 */
export async function migrateStateRecord({
	destination, sources = [], schema, owner, validate, lockHeld = false,
	decode = JSON.parse, encode = jsonText, afterPublish, isSourceAllowed = (source) => sources.includes(source),
}) {
	const perform = async () => {
		const markerPath = `${destination}.migration.json`;
		const markerRaw = await readStateText(markerPath);
		let marker = markerRaw === null ? null : JSON.parse(markerRaw);
		if (marker && (
			marker.version !== 1 || marker.component !== STATE_COMPONENT ||
			marker.schema !== schema || marker.destination !== destination ||
			!sameOwner(marker.owner, owner) || !isSourceAllowed(marker.source) ||
			!["copying", "complete"].includes(marker.status) ||
			!/^[a-f0-9]{64}$/.test(marker.sourceHash) || !/^[a-f0-9]{64}$/.test(marker.destinationHash)
		)) throw new Error(`Invalid migration ownership receipt: ${markerPath}`);

		let canonical = await readStateText(destination);
		if (marker) {
			const original = await readStateText(marker.source);
			if (original !== null && stateDigest(original) !== marker.sourceHash) {
				throw new Error(`Legacy state changed after migration; reconcile explicitly: ${marker.source}`);
			}
			if (canonical === null && marker.status === "complete") {
				// A canonical owner intentionally removed this record. Do not resurrect it.
				return null;
			}
			if (canonical !== null && marker.status === "copying") {
				if (stateDigest(canonical) !== marker.destinationHash) {
					throw new Error(`Interrupted migration conflicts with canonical state: ${destination}`);
				}
				await validate(decode(canonical), { source: destination, canonical: true });
				marker = { ...marker, status: "complete" };
				await atomicStateWrite(markerPath, jsonText(marker));
			}
		}
		if (canonical !== null) {
			return { value: await validate(decode(canonical), { source: destination, canonical: true }), revision: stateDigest(canonical) };
		}

		const candidates = [];
		for (const source of new Set([...sources, ...(marker ? [marker.source] : [])])) {
			const raw = await readStateText(source);
			if (raw === null) continue;
			const value = await validate(decode(raw), { source, canonical: false });
			candidates.push({ source, raw, encoded: encode(value), value });
		}
		if (!candidates.length) {
			if (marker) throw new Error(`Interrupted migration source is missing: ${marker.source}`);
			return null;
		}
		if (candidates.some((item) => item.encoded !== candidates[0].encoded)) {
			throw new Error(`Divergent legacy state requires explicit reconciliation: ${destination}`);
		}
		const selected = marker ? candidates.find((item) => item.source === marker.source) : candidates[0];
		if (!selected || (marker && stateDigest(selected.encoded) !== marker.destinationHash)) {
			throw new Error(`Interrupted migration source no longer matches: ${destination}`);
		}
		marker = {
			version: 1, component: STATE_COMPONENT, schema, owner,
			source: selected.source, destination, sourceHash: stateDigest(selected.raw),
			destinationHash: stateDigest(selected.encoded), status: "copying",
		};
		await atomicStateWrite(markerPath, jsonText(marker));
		if (await readStateText(selected.source) !== selected.raw) {
			throw new Error(`Legacy state changed during migration: ${selected.source}`);
		}
		await atomicStateWrite(destination, selected.encoded, { exclusive: true });
		if (afterPublish) await afterPublish();
		await atomicStateWrite(markerPath, jsonText({ ...marker, status: "complete" }));
		canonical = selected.encoded;
		return { value: selected.value, revision: stateDigest(canonical) };
	};
	return lockHeld ? perform() : withStateLock(destination, perform);
}

export async function writeStateRecord({ destination, value, revision, validate }) {
	return withStateLock(destination, async () => {
		const current = await readStateText(destination);
		if ((current === null ? null : stateDigest(current)) !== revision) {
			throw new Error(`State changed in another canvas instance; reopen before saving: ${destination}`);
		}
		const encoded = jsonText(await validate(value, { source: destination, canonical: true }));
		await atomicStateWrite(destination, encoded);
		return stateDigest(encoded);
	});
}
