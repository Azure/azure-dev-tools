const HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const PROTECTED_HEADERS = new Set([
	"__proto__",
	"authorization",
	"connection",
	"constructor",
	"content-length",
	"cookie",
	"host",
	"proxy-authorization",
	"prototype",
	"set-cookie",
	"transfer-encoding",
	"x-api-key",
	"x-functions-key",
	"x-zumo-auth",
]);
const SENSITIVE_NAME = /(^|[-_])(auth(?:orization)?|cookie|credential|key|password|secret|signature|token)($|[-_])/i;
const SENSITIVE_VALUE =
	/^(?:basic|bearer)\s+\S+|(?:^|[?&])(code|key|password|secret|sig|signature|token)=|^[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}$/i;

function isSensitiveName(name) {
	const separated = String(name).replace(/([a-z0-9])([A-Z])/g, "$1-$2");
	const compact = separated.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
	return (
		SENSITIVE_NAME.test(separated) ||
		compact.includes("apikey") ||
		compact.includes("accesskey") ||
		compact.includes("functionkey") ||
		compact.includes("authtoken")
	);
}

function parseObject(text, label, { empty } = {}) {
	const source = String(text ?? "");
	if (!source.trim()) return empty;
	let value;
	try {
		value = JSON.parse(source);
	} catch (error) {
		throw new TypeError(`${label} must be valid JSON. ${error.message}`);
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new TypeError(`${label} must be a JSON object.`);
	}
	return value;
}

function containsSensitiveValue(value, key = "") {
	if (isSensitiveName(key)) return true;
	if (Array.isArray(value)) return value.some((item) => containsSensitiveValue(item));
	if (value && typeof value === "object") {
		return Object.entries(value).some(([childKey, childValue]) => containsSensitiveValue(childValue, childKey));
	}
	return typeof value === "string" && SENSITIVE_VALUE.test(value.trim());
}

export function containsCredentialLikeValue(value) {
	return containsSensitiveValue(value);
}

function redactBodyValue(value, key = "") {
	if (isSensitiveName(key)) return "[redacted]";
	if (Array.isArray(value)) return value.map((item) => redactBodyValue(item));
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([childKey, childValue]) => [
				childKey,
				redactBodyValue(childValue, childKey),
			]),
		);
	}
	if (typeof value === "string" && SENSITIVE_VALUE.test(value.trim())) return "[redacted]";
	return value;
}

export function parseHttpRequestDraft({ headersText = "", bodyText = "" } = {}) {
	const rawHeaders = parseObject(headersText, "HTTP headers", { empty: {} });
	const headers = {};
	const overriddenHeaders = [];
	for (const [name, rawValue] of Object.entries(rawHeaders)) {
		const normalizedName = String(name).trim();
		const lowerName = normalizedName.toLowerCase();
		if (!HEADER_NAME.test(normalizedName)) {
			throw new TypeError(`HTTP header "${normalizedName}" has an invalid name.`);
		}
		if (PROTECTED_HEADERS.has(lowerName) || isSensitiveName(normalizedName)) {
			throw new TypeError(
				`HTTP header "${normalizedName}" is protected. Authentication, host, length, cookie, and secret headers are managed by Azure Functions Hosted Skills Preview.`,
			);
		}
		if (!["string", "number", "boolean"].includes(typeof rawValue)) {
			throw new TypeError(`HTTP header "${normalizedName}" must have a string, number, or boolean value.`);
		}
		const value = String(rawValue);
		if (/[\r\n]/.test(value)) throw new TypeError(`HTTP header "${normalizedName}" cannot contain a line break.`);
		if (SENSITIVE_VALUE.test(value.trim())) {
			throw new TypeError(`HTTP header "${normalizedName}" appears to contain a credential and is not allowed.`);
		}
		if (lowerName === "content-type") {
			if (value.trim().toLowerCase() !== "application/json") overriddenHeaders.push(normalizedName);
			continue;
		}
		headers[normalizedName] = value;
	}

	const sourceBody = String(bodyText ?? "");
	const body = parseObject(sourceBody, "HTTP body", { empty: null });
	return {
		headers,
		body,
		bodyText: sourceBody,
		hasBody: Boolean(sourceBody.trim()),
		overriddenHeaders,
		persistable: !containsSensitiveValue(body),
	};
}

export function buildHttpPostRequest(draft, { authorizationHeader = "", authorizationLabel = "anonymous" } = {}) {
	const request = parseHttpRequestDraft(draft);
	const headers = { ...request.headers, "Content-Type": "application/json" };
	if (authorizationHeader) headers["x-functions-key"] = authorizationHeader;
	const displayHeaders = { ...request.headers, "Content-Type": "application/json" };
	if (authorizationHeader) displayHeaders["x-functions-key"] = "[redacted]";
	return {
		init: {
			method: "POST",
			headers,
			body: request.bodyText,
		},
		display: {
			method: "POST",
			auth: authorizationLabel,
			headers: displayHeaders,
			body: request.hasBody ? JSON.stringify(redactBodyValue(request.body)) : "",
			overriddenHeaders: request.overriddenHeaders,
		},
		persistable: request.persistable,
	};
}

export function defaultHttpRequestDraft() {
	return { headersText: "{}", bodyText: "" };
}
