const MAX_AGENT_OUTPUT_CHARS = 100_000;
export const MAX_REMOTE_AGENT_RESPONSE_CHARS = 8_000;
const MAX_AGENT_ENVELOPE_CHARS = 500_000;
const MAX_AGENT_ENVELOPE_DEPTH = 4;
const MAX_TELEMETRY_CORRELATION_MS = 30 * 60 * 1000;
const AGENT_RESPONSE_LOGGING_MARKER =
	"# Intelligent Function App Studio: expose completed agent responses (v5)";
const LEGACY_AGENT_RESPONSE_LOGGING = [
	"import logging",
	"",
	'logging.getLogger("azure.functions.AgentRuntime").setLevel(logging.INFO)',
	"",
].join("\n");
const ORIGINAL_AGENT_RESPONSE_LOGGING =
	/^import logging\nimport sys\n\n# Intelligent Function App Studio: expose completed agent responses\n[\s\S]*?_agent_runtime_logger\.addHandler\(_agent_runtime_handler\)\n/;
const VERSION_TWO_AGENT_RESPONSE_LOGGING =
	/^import logging\n\n# Intelligent Function App Studio: expose completed agent responses \(v2\)\n# Core Tools filters this named logger's INFO records from the local host stream\.\n_agent_runtime_logger = logging\.getLogger\("azure\.functions\.AgentRuntime"\)\n_agent_runtime_logger\.info = _agent_runtime_logger\.warning\n/;
const VERSION_THREE_OR_FOUR_AGENT_RESPONSE_LOGGING =
	/^import logging\nimport json\n\n# Intelligent Function App Studio: expose completed agent responses \(v[34]\)\n[\s\S]*?_agent_runtime_logger\.info = _studio_agent_response_info\n/;

function isPlainObject(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwn(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key);
}

function parseJsonText(value) {
	const text = String(value || "").trim();
	if (!text || text.length > MAX_AGENT_ENVELOPE_CHARS || !'{"['.includes(text[0])) {
		return { parsed: false, value: null };
	}
	try {
		return { parsed: true, value: JSON.parse(text) };
	} catch {
		return { parsed: false, value: null };
	}
}

function boundedText(value) {
	return String(value ?? "")
		.replace(/\r\n?/g, "\n")
		.trim()
		.slice(0, MAX_AGENT_OUTPUT_CHARS);
}

function decodeSerializedLineEndingsOnce(value) {
	const text = String(value ?? "").replace(/\r\n?/g, "\n");
	if (text.includes("\n") || !/\\r\\n|\\n|\\r/.test(text)) return text;
	return text
		.replace(/\\r\\n/g, "\n")
		.replace(/\\n\\n|\\r\\r/g, "\n\n")
		.replace(/\\(?:n|r)(?=(?:#{1,6}\s|[-*+]\s|\d+\.\s))/g, "\n")
		.replace(/\\(?:n|r)$/g, "\n");
}

function agentResponseText(value) {
	return decodeSerializedLineEndingsOnce(value).trim().slice(0, MAX_AGENT_OUTPUT_CHARS);
}

function nestedResponseText(value, depth) {
	if (depth > MAX_AGENT_ENVELOPE_DEPTH) return "";
	if (typeof value === "string") {
		const candidate = parseJsonText(value);
		if (candidate.parsed) {
			if (typeof candidate.value === "string") return agentResponseText(candidate.value);
			const nested = expectedAgentResponse(candidate.value, depth + 1);
			if (nested) return nested;
		}
		return agentResponseText(value);
	}
	if (!isPlainObject(value)) return "";

	const nested = expectedAgentResponse(value, depth + 1);
	if (nested) return nested;
	if (typeof value.content === "string") return agentResponseText(value.content);
	if (typeof value.text === "string") return agentResponseText(value.text);
	if (typeof value.message === "string") return agentResponseText(value.message);
	if (isPlainObject(value.message)) return nestedResponseText(value.message, depth + 1);
	if (hasOwn(value, "response")) return nestedResponseText(value.response, depth + 1);
	return "";
}

function expectedAgentResponse(value, depth = 0) {
	if (depth > MAX_AGENT_ENVELOPE_DEPTH || !isPlainObject(value)) return "";
	const expectedEnvelope =
		hasOwn(value, "session_id") ||
		hasOwn(value, "sessionId") ||
		hasOwn(value, "tool_calls") ||
		hasOwn(value, "toolCalls");
	if (!expectedEnvelope) return "";

	if (hasOwn(value, "response")) {
		return nestedResponseText(value.response, depth + 1);
	}
	for (const key of ["result", "data", "body", "output"]) {
		if (!hasOwn(value, key)) continue;
		const response = nestedResponseText(value[key], depth + 1);
		if (response) return response;
	}
	return "";
}

export function normalizeAgentOutput(value) {
	if (typeof value === "string") {
		const candidate = parseJsonText(value);
		if (!candidate.parsed) return boundedText(value);
		if (typeof candidate.value === "string") {
			const nestedCandidate = parseJsonText(candidate.value);
			if (nestedCandidate.parsed) {
				const nestedResponse = expectedAgentResponse(nestedCandidate.value);
				if (nestedResponse) return nestedResponse;
			}
			return agentResponseText(candidate.value);
		}
		const response = expectedAgentResponse(candidate.value);
		if (response) return response;
		return boundedText(JSON.stringify(candidate.value, null, 2));
	}

	if (value == null) return "";
	const response = expectedAgentResponse(value);
	if (response) return response;
	return boundedText(JSON.stringify(value, null, 2));
}

export function parseAgentResponseLog(line) {
	const marker = "Agent response:";
	const markerIndex = String(line || "").indexOf(marker);
	if (markerIndex === -1) return null;

	const payloadIndex = line.indexOf("payload=", markerIndex + marker.length);
	if (payloadIndex === -1) return null;

	try {
		const payload = JSON.parse(line.slice(payloadIndex + "payload=".length));
		const response = normalizeAgentOutput(payload);
		if (!response) return null;
		return {
			response,
			sessionId: typeof payload.session_id === "string" ? payload.session_id : "",
		};
	} catch {
		return null;
	}
}

export function installAgentResponseLogging(source) {
	const input = String(source || "");
	if (input.includes(AGENT_RESPONSE_LOGGING_MARKER)) return input;
	const cleanSource = input
		.replace(ORIGINAL_AGENT_RESPONSE_LOGGING, "")
		.replace(VERSION_TWO_AGENT_RESPONSE_LOGGING, "")
		.replace(VERSION_THREE_OR_FOUR_AGENT_RESPONSE_LOGGING, "")
		.replace(LEGACY_AGENT_RESPONSE_LOGGING, "");
	const loggerSetup = [
		"import logging",
		"import json",
		"",
		AGENT_RESPONSE_LOGGING_MARKER,
		"# Emit only the bounded final response. The runtime's default record also includes",
		"# full tool-call payloads, which can exceed Application Insights trace limits.",
		'_agent_runtime_logger = logging.getLogger("azure.functions.AgentRuntime")',
		"_agent_runtime_info = _agent_runtime_logger.info",
		"",
		"def _studio_agent_response_info(message, *args, **kwargs):",
		'    if message == "Agent response: source_file=%s payload=%s" and len(args) >= 2:',
		"        try:",
		"            payload = json.loads(str(args[1]))",
		"            compact = {",
		'                "session_id": str(payload.get("session_id") or ""),',
		`                "response": str(payload.get("response") or "")[:${MAX_REMOTE_AGENT_RESPONSE_CHARS}],`,
		"            }",
		"        except (TypeError, ValueError):",
		`            compact = {"session_id": "", "response": str(args[1])[:${MAX_REMOTE_AGENT_RESPONSE_CHARS}]}`,
		'        logging.warning("Agent response: source_file=%s payload=%s", args[0], json.dumps(compact, ensure_ascii=False))',
		"        return",
		"    _agent_runtime_info(message, *args, **kwargs)",
		"",
		"_agent_runtime_logger.info = _studio_agent_response_info",
		"",
	].join("\n");
	return `${loggerSetup}${cleanSource}`;
}

export function isAwaitingAgentResponse(invocation, now = Date.now()) {
	const invokedAt = Date.parse(invocation?.invokedAt || "");
	const age = now - invokedAt;
	return (
		invocation?.target === "azure" &&
		invocation?.awaitAgentResponse === true &&
		invocation?.trigger !== "http" &&
		invocation?.ok === true &&
		!invocation?.response &&
		Number.isFinite(invokedAt) &&
		age >= 0 &&
		age <= MAX_TELEMETRY_CORRELATION_MS
	);
}

export function hasPendingAgentResponse(invocations, functionName, now = Date.now()) {
	return (invocations || []).some(
		(invocation) =>
			invocation?.functionName === functionName && isAwaitingAgentResponse(invocation, now),
	);
}

export function applyAgentResponseTelemetry(invocations, outputs) {
	let changed = false;
	for (const output of outputs || []) {
		const parsed = parseAgentResponseLog(output?.message);
		const outputTime = Date.parse(output?.time || "");
		const operationId = String(output?.operationId || "").trim();
		if (!parsed || !Number.isFinite(outputTime) || !operationId) continue;
		if ((invocations || []).some((item) => item?.operationId === operationId)) continue;
		const candidates = (invocations || [])
			.map((item) => ({ item, invokedAt: Date.parse(item?.invokedAt || "") }))
			.filter(({ item, invokedAt }) => {
				const age = outputTime - invokedAt;
				return (
					isAwaitingAgentResponse(item, outputTime) &&
					item?.functionName === output.functionName &&
					age >= 0
				);
			})
			.sort((left, right) => right.invokedAt - left.invokedAt);
		const invocation = candidates[0]?.item;
		if (!invocation) continue;
		invocation.response = parsed.response;
		invocation.sessionId = parsed.sessionId;
		invocation.operationId = operationId;
		invocation.note = "Agent output captured from Application Insights.";
		changed = true;
	}
	return changed;
}
