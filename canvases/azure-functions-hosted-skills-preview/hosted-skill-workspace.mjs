import { createHash } from "node:crypto";
import { readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const TRIGGER_KINDS = new Map([
	["timer_trigger", "timer"],
	["http_trigger", "http"],
	["queue_trigger", "queue"],
	["connector_trigger", "connector"],
]);

function normalizedRelativePath(value) {
	return String(value || "").split(path.sep).join("/");
}

function yamlScalar(value) {
	const raw = String(value || "").trim();
	const quoted = raw.match(/^(["'])(.*)\1$/);
	if (quoted) return quoted[2];
	if (raw === "true") return true;
	if (raw === "false") return false;
	if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
	if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
		try {
			return JSON.parse(raw.replace(/'/g, '"'));
		} catch {
			return raw;
		}
	}
	return raw;
}

function triggerArgsOf(frontmatter) {
	const triggerBlock = frontmatter.match(/^\s*trigger:\s*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1] || "";
	const argsBlock = triggerBlock.match(/^\s{2}args:\s*\r?\n((?:\s{4}.*(?:\r?\n|$))*)/m)?.[1] || "";
	const args = {};
	for (const line of argsBlock.split(/\r?\n/)) {
		const match = /^\s{4}([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
		if (match) args[match[1]] = yamlScalar(match[2]);
	}
	return args;
}

export function agentDocument(text, relativePath = "") {
	const source = String(text);
	const frontmatterMatch = /^\s*(---\r?\n[\s\S]*?\r?\n---\r?\n?)/.exec(source);
	const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";
	const body = (frontmatterMatch ? source.slice(frontmatterMatch[0].length) : source).trim();
	const rawName = frontmatter.match(/^\s*name:\s*(.*?)\s*$/m)?.[1]?.trim() || "";
	const name = rawName.match(/^(["'])(.*)\1$/)?.[2] || rawName || "Untitled skill";
	const rawDescription = frontmatter.match(/^\s*description:\s*(.*?)\s*$/m)?.[1]?.trim() || "";
	const description = rawDescription.match(/^(["'])(.*)\1$/)?.[2] || rawDescription;
	const triggerBlock = frontmatter.match(/^\s*trigger:\s*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1] || "";
	const triggerType = triggerBlock.match(/^\s*type:\s*([A-Za-z0-9_-]+)\s*$/m)?.[1] || "";
	const trigger = TRIGGER_KINDS.get(triggerType) || "";
	const triggerArgs = triggerArgsOf(frontmatter);
	const route = typeof triggerArgs.route === "string" ? triggerArgs.route : "";
	const relPath = normalizedRelativePath(relativePath);
	return {
		relativePath: relPath,
		fileName: path.posix.basename(relPath),
		name,
		description,
		trigger,
		triggerType,
		triggerArgs,
		route,
		functionName: path.posix.basename(relPath, ".agent.md").replace(/-/g, "_"),
		revision: createHash("sha256").update(source).digest("hex"),
		frontmatter,
		body,
	};
}

export async function discoverHostedSkills(root) {
	const nestedSourceDir = path.join(root, "src");
	const sourceDir = await readdir(nestedSourceDir, { withFileTypes: true })
		.then(() => nestedSourceDir)
		.catch((error) => {
			if (error?.code === "ENOENT") return root;
			throw error;
		});
	const entries = await readdir(sourceDir, { withFileTypes: true });
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".agent.md"))
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));
	const skills = [];
	for (const fileName of files) {
		const relativePath = normalizedRelativePath(path.relative(root, path.join(sourceDir, fileName)));
		const source = await readFile(path.join(sourceDir, fileName), "utf8");
		const skill = agentDocument(source, relativePath);
		if (skill.trigger) skills.push(skill);
	}
	return skills.sort((a, b) =>
		a.trigger.localeCompare(b.trigger) ||
		a.name.localeCompare(b.name) ||
		a.relativePath.localeCompare(b.relativePath),
	);
}

export function chooseHostedSkill(skills, trigger, preferredPath = "") {
	const applicable = skills.filter((skill) => skill.trigger === trigger);
	const selected = applicable.find((skill) => skill.relativePath === normalizedRelativePath(preferredPath));
	if (selected) return { selected, applicable, fallback: false, missingPath: "" };
	return {
		selected: applicable[0] || null,
		applicable,
		fallback: Boolean(preferredPath),
		missingPath: preferredPath ? normalizedRelativePath(preferredPath) : "",
	};
}

export function timerHttpTwin(timerSkill, skills) {
	if (!timerSkill || timerSkill.trigger !== "timer") return null;
	const stem = timerSkill.relativePath.slice(0, -".agent.md".length);
	const expected = `${stem}-http.agent.md`;
	return skills.find(
		(skill) =>
			skill.trigger === "http" &&
			skill.relativePath === expected &&
			skill.body.trim() === timerSkill.body.trim(),
	) || null;
}

export function replaceAgentBody(source, bodyText) {
	const parsed = agentDocument(source);
	const frontmatter = parsed.frontmatter || "---\nname: Agent\ndescription: Agent\n---\n";
	return `${frontmatter}\n${String(bodyText).trim()}\n`;
}

export async function writeAgentBodyIfRevision(filePath, bodyText, expectedRevision) {
	const source = await readFile(filePath, "utf8");
	const currentRevision = createHash("sha256").update(source).digest("hex");
	if (!expectedRevision || currentRevision !== expectedRevision) {
		throw new Error(
			"Skill instructions changed on disk after this editor loaded. Your text remains in the editor; refresh after preserving or reconciling it.",
		);
	}
	const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
	try {
		await writeFile(temporary, replaceAgentBody(source, bodyText));
		const beforeReplace = await readFile(filePath, "utf8");
		if (createHash("sha256").update(beforeReplace).digest("hex") !== currentRevision) {
			throw new Error(
				"Skill instructions changed on disk while saving. Your text remains in the editor; refresh after preserving or reconciling it.",
			);
		}
		await rename(temporary, filePath);
	} catch (error) {
		await rm(temporary, { force: true }).catch(() => {});
		throw error;
	}
}
