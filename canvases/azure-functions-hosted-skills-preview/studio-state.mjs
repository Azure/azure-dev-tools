import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { containsCredentialLikeValue, parseHttpRequestDraft } from "./shared/function-app-core/src/http-request.mjs";
import { validateTriggerPayloadDraft } from "./trigger-drafts.mjs";
import {
	STATE_COMPONENT, assertSafeStatePath, atomicStateWrite, migrateStateRecord,
	readStateText, studioStatePaths, withStateLock, writeStateRecord,
} from "./state-migration.mjs";

function object(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalid(schema) {
	throw new Error(`Invalid or unsafe persisted ${schema} schema; legacy state was not changed.`);
}

export function validateHttpDraftState(value) {
	if (!object(value)) invalid("HTTP draft");
	const result = {};
	for (const [key, draft] of Object.entries(value)) {
		if (key !== "local:http" && !/^azure:(?:app|\/subscriptions\/[^:\r\n]+):[^:\r\n]+$/i.test(key)) invalid("HTTP draft endpoint");
		if (!object(draft) || Object.keys(draft).some((name) => !["headersText", "bodyText"].includes(name)) ||
			typeof draft.headersText !== "string" || typeof draft.bodyText !== "string") invalid("HTTP draft");
		if (!parseHttpRequestDraft(draft).persistable) invalid("HTTP draft credentials");
		result[key] = { headersText: draft.headersText, bodyText: draft.bodyText };
	}
	return result;
}

export function validateTriggerDraftState(value) {
	if (!object(value) || Object.keys(value).some((key) => !["queue", "connector"].includes(key))) invalid("trigger draft");
	const result = {};
	for (const [key, text] of Object.entries(value)) {
		if (typeof text !== "string" || !validateTriggerPayloadDraft(key, text).persistable) invalid("trigger draft");
		result[key] = text;
	}
	return result;
}

const TEXT_FIELDS = ["time", "phase", "target", "trigger", "origin", "executionId", "functionName", "sessionId", "operationId", "invokedAt", "note", "response"];
const NUMBER_FIELDS = ["id", "status", "ms", "logSequence", "retryAfterSeconds"];
const unsafeText = (value) => containsCredentialLikeValue(value) ||
	/(?:basic|bearer)\s+[A-Za-z0-9+/_.=-]+|https?:\/\/[^\s/]+:[^\s/@]+@|[?&](?:code|sig|token|key|secret)=[^&\s]+|["'](?:api[_-]?key|access[_-]?token|password|secret)["']\s*:/i.test(value);

export function validateInvocationState(value) {
	if (!Array.isArray(value) || value.length > 40) invalid("invocation history");
	return value.map((event) => {
		if (!object(event) || !Number.isInteger(event.id) || event.id < 1 ||
			!["local", "azure"].includes(event.target) ||
			![true, false, null].includes(event.ok) ||
			(event.phase !== undefined && !["running", "failed", "completed"].includes(event.phase))) invalid("invocation history");
		const projected = { ok: event.ok };
		for (const key of TEXT_FIELDS) {
			if (event[key] === undefined) continue;
			if (typeof event[key] !== "string" || event[key].length > 100_000) invalid("invocation history");
			projected[key] = unsafeText(event[key]) ? "[redacted]" : event[key];
		}
		for (const key of NUMBER_FIELDS) {
			if (event[key] === undefined) continue;
			if (event[key] !== null && (typeof event[key] !== "number" || !Number.isFinite(event[key]))) invalid("invocation history");
			projected[key] = event[key];
		}
		if (event.awaitAgentResponse !== undefined) {
			if (typeof event.awaitAgentResponse !== "boolean") invalid("invocation history");
			projected.awaitAgentResponse = event.awaitAgentResponse;
		}
		if (event.tools !== undefined) {
			if (!Array.isArray(event.tools) || event.tools.some((tool) => !object(tool) || typeof tool.name !== "string" || typeof tool.ok !== "boolean")) invalid("invocation tools");
			projected.tools = event.tools.map(({ name, ok }) => ({ name: unsafeText(name) ? "[redacted]" : name, ok }));
		}
		if (event.payloads !== undefined) {
			if (!Array.isArray(event.payloads) || event.payloads.some((item) => !object(item) || typeof item.tool !== "string" ||
				!Number.isFinite(item.inputBytes) || !Number.isFinite(item.outputBytes))) invalid("invocation telemetry");
			projected.payloads = event.payloads.map(({ tool, inputBytes, outputBytes }) => ({
				tool: unsafeText(tool) ? "[redacted]" : tool, inputBytes, outputBytes,
			}));
		}
		return projected;
	});
}

const SCHEMAS = {
	"invocations.json": { schema: "studio.invocations.v1", validate: validateInvocationState },
	"http-request-drafts.json": { schema: "studio.http-request-drafts.v1", validate: validateHttpDraftState },
	"trigger-payload-drafts.json": { schema: "studio.trigger-payload-drafts.v1", validate: validateTriggerDraftState },
};

export class StudioState {
	constructor(options = {}) {
		this.paths = studioStatePaths(options);
		this.revisions = new Map();
		this.writes = Promise.resolve();
	}

	async initialize() {
		if (this.paths.ambiguousLegacyRoot) {
			try {
				await lstat(this.paths.ambiguousLegacyRoot);
				throw new Error(`Legacy instance ID was lossy; ownership cannot be inferred: ${this.paths.ambiguousLegacyRoot}`);
			} catch (error) {
				if (error?.code !== "ENOENT") throw error;
			}
		}
		const file = path.join(this.paths.root, "owner.json");
		await withStateLock(file, async () => {
			const raw = await readStateText(file);
			const expected = { version: 1, ...this.paths.owner };
			if (raw !== null) {
				const value = JSON.parse(raw);
				if (JSON.stringify(value) !== JSON.stringify(expected)) throw new Error(`Canonical state owner does not match this instance: ${file}`);
			} else {
				const children = await readdir(this.paths.root);
				// Contenders may briefly hold the recovery gate while this lock holder initializes.
				await readStateText(`${file}.lock.recovery`);
				if (children.some((name) => name !== "owner.json.lock" && name !== "owner.json.lock.recovery")) {
					throw new Error(`Canonical state has no ownership record; reconcile explicitly: ${this.paths.root}`);
				}
				await atomicStateWrite(file, `${JSON.stringify(expected)}\n`, { exclusive: true });
			}
		});
		return this;
	}

	file(name) {
		if (!SCHEMAS[name]) throw new Error(`Unsupported canvas state component: ${name}`);
		return path.join(this.paths.root, name);
	}

	async load(name) {
		const contract = SCHEMAS[name];
		const result = await migrateStateRecord({
			destination: this.file(name),
			sources: this.paths.legacyRoots.map((root) => path.join(root, name)),
			owner: this.paths.owner, ...contract,
		});
		this.revisions.set(name, result?.revision ?? null);
		return result?.value ?? null;
	}

	async save(name, value) {
		const operation = this.writes.then(async () => {
			if (!this.revisions.has(name)) throw new Error(`Load ${name} before writing canonical state.`);
			const revision = await writeStateRecord({
				destination: this.file(name), value, revision: this.revisions.get(name),
				validate: SCHEMAS[name].validate,
			});
			this.revisions.set(name, revision);
		});
		this.writes = operation.catch(() => {});
		return operation;
	}

	// Generated code, local credentials, and azd environment state stay in place.
	// Only a validated location reference is persisted, never copied wholesale.
	async runtimeDirectory(name, validate) {
		if (!["template", "deployment"].includes(name)) throw new Error("Unsupported runtime directory.");
		const canonical = path.join(this.paths.root, name);
		const reference = path.join(this.paths.root, `${name}.location.json`);
		const legacy = this.paths.legacyRoots.map((root) => path.join(root, name));
		const present = async (dir) => {
			await assertSafeStatePath(dir);
			try {
				if (!(await lstat(dir)).isDirectory()) throw new Error(`Invalid runtime directory: ${dir}`);
				return true;
			} catch (error) {
				if (error?.code === "ENOENT") return false;
				throw error;
			}
		};
		return withStateLock(reference, async () => {
			const saved = await readStateText(reference);
			if (saved !== null) {
				const record = JSON.parse(saved);
				if (record.version !== 1 || record.component !== STATE_COMPONENT ||
					record.instanceId !== this.paths.owner.instanceId || record.schema !== `studio.${name}-location.v1` ||
					record.destination !== canonical || !legacy.includes(record.source) || record.mode !== "reference") {
					throw new Error(`Invalid runtime location ownership: ${reference}`);
				}
				if (await present(canonical)) throw new Error(`Canonical and retained runtime locations conflict: ${canonical}`);
				if (!(await present(record.source))) throw new Error(`Retained runtime location is missing: ${record.source}`);
				await validate(record.source);
				return record.source;
			}
			if (await present(canonical)) {
				await validate(canonical);
				return canonical;
			}
			const candidates = [];
			for (const dir of legacy) if (await present(dir)) candidates.push(dir);
			if (candidates.length > 1) throw new Error(`Multiple legacy runtime directories require reconciliation: ${name}`);
			if (!candidates.length) return canonical;
			await validate(candidates[0]);
			await atomicStateWrite(reference, `${JSON.stringify({
				version: 1, component: STATE_COMPONENT, instanceId: this.paths.owner.instanceId,
				schema: `studio.${name}-location.v1`, source: candidates[0], destination: canonical, mode: "reference",
			}, null, 2)}\n`, { exclusive: true });
			return candidates[0];
		});
	}
}
