import { readdir, readFile } from "node:fs/promises";
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

export function agentDocument(text, relativePath = "") {
	const source = String(text);
	const frontmatterMatch = /^\s*(---\r?\n[\s\S]*?\r?\n---\r?\n?)/.exec(source);
	const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";
	const body = (frontmatterMatch ? source.slice(frontmatterMatch[0].length) : source).trim();
	const rawName = frontmatter.match(/^\s*name:\s*(.*?)\s*$/m)?.[1]?.trim() || "";
	const name = rawName.match(/^(["'])(.*)\1$/)?.[2] || rawName || "Untitled skill";
	const triggerType = frontmatter.match(/^\s*type:\s*([A-Za-z0-9_-]+)\s*$/m)?.[1] || "";
	const trigger = TRIGGER_KINDS.get(triggerType) || "";
	const route = frontmatter.match(/^\s*route:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim() || "";
	const relPath = normalizedRelativePath(relativePath);
	return {
		relativePath: relPath,
		fileName: path.posix.basename(relPath),
		name,
		trigger,
		triggerType,
		route,
		functionName: path.posix.basename(relPath, ".agent.md").replace(/-/g, "_"),
		frontmatter,
		body,
	};
}

export async function discoverHostedSkills(root) {
	const sourceDir = path.join(root, "src");
	const entries = await readdir(sourceDir, { withFileTypes: true });
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".agent.md"))
		.map((entry) => entry.name)
		.sort((a, b) => a.localeCompare(b));
	const skills = [];
	for (const fileName of files) {
		const relativePath = normalizedRelativePath(path.join("src", fileName));
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
