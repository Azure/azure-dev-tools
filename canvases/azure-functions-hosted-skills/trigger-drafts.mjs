import { readFile } from "node:fs/promises";
import { atomicStateWrite, withStateLock } from "./state-migration.mjs";

import { containsCredentialLikeValue } from "./shared/function-app-core/src/http-request.mjs";
import { DEFAULT_M365_INBOX_PAYLOAD, m365InboxDryRunPromptFromJson } from "./connector-trigger.mjs";
import { DEFAULT_QUEUE_MESSAGE, normalizeQueueMessage } from "./queue-trigger.mjs";

export function defaultTriggerPayloadDrafts() {
	return {
		queue: DEFAULT_QUEUE_MESSAGE,
		connector: JSON.stringify(DEFAULT_M365_INBOX_PAYLOAD, null, 2),
	};
}

export function validateTriggerPayloadDraft(trigger, value) {
	const text = String(value ?? "");
	let payload;
	if (trigger === "queue") {
		normalizeQueueMessage(text);
		payload = JSON.parse(text);
	} else if (trigger === "connector") {
		m365InboxDryRunPromptFromJson(text);
		payload = JSON.parse(text);
	} else {
		throw new Error("Only Queue and Connector payload drafts are supported.");
	}
	return {
		value: text,
		persistable: !containsCredentialLikeValue(payload),
	};
}

export async function persistTriggerPayloadDrafts(file, drafts, { write } = {}) {
	const persisted = {};
	for (const trigger of ["queue", "connector"]) {
		try {
			const draft = validateTriggerPayloadDraft(trigger, drafts?.[trigger]);
			if (draft.persistable) persisted[trigger] = draft.value;
		} catch {
			/* Invalid and credential-like drafts remain in memory only. */
		}
	}
	if (write) await write(persisted);
	else await withStateLock(file, () => atomicStateWrite(file, `${JSON.stringify(persisted, null, 2)}\n`));
	return persisted;
}

export async function loadTriggerPayloadDrafts(file, { read } = {}) {
	const drafts = defaultTriggerPayloadDrafts();
	if (read) return { ...drafts, ...(await read()) };
	try {
		const parsed = JSON.parse(await readFile(file, "utf8"));
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return drafts;
		for (const trigger of ["queue", "connector"]) {
			if (!Object.prototype.hasOwnProperty.call(parsed, trigger)) continue;
			const draft = validateTriggerPayloadDraft(trigger, parsed[trigger]);
			if (draft.persistable) drafts[trigger] = draft.value;
		}
	} catch {
		/* First open or a malformed stale draft file uses safe defaults. */
	}
	return drafts;
}
