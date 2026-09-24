import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedSkills = {
  "azure-sre-agent": ["./skills/azure-sre-agent-canvas/"],
  "azure-functions-hosted-skills": [
    "./skills/azure-functions-hosted-skills-canvas/",
    "./skills/azure-functions-hosted-skills-github-daily-digest/",
  ],
  "azure-resources-query": ["./skills/azure-resources-query/"],
};
const products = Object.keys(expectedSkills);

function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function requireFile(sha, path) {
  git("cat-file", "-e", `${sha}:${path}`);
}

export function verifyMarketplace(manifest) {
  if (!manifest.name || !/^[a-z][a-z0-9-]*$/.test(manifest.name)) {
    throw new Error("Marketplace must have a kebab-case name");
  }
  if (!manifest.owner?.name || !Array.isArray(manifest.plugins)) {
    throw new Error("Marketplace must have an owner and plugins array");
  }
  const names = manifest.plugins.map(({ name }) => name);
  if (names.length !== products.length || new Set(names).size !== products.length ||
      products.some((name) => !names.includes(name))) {
    throw new Error("Marketplace must contain exactly the three Azure canvas plugins");
  }

  return manifest.plugins.map(verifyPlugin);
}

export function verifyPlugin({ source, name, version }) {
  if (!products.includes(name) || !/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error(`${name}: expected an Azure canvas product and numeric semantic version`);
  }
  const path = `canvases/${name}`;
  let revision;
  let releaseTag;
  if (source === path) {
    const tags = git("tag", "-l", `${name}-v${version.replaceAll(".", "-")}-*`)
      .split("\n").filter(Boolean);
    if (tags.length !== 1) {
      throw new Error(`${name}@${version}: expected exactly one reviewed immutable release tag`);
    }
    releaseTag = tags[0];
    revision = "HEAD";
    if (git("rev-parse", `${revision}:${path}`) !==
        git("rev-parse", `${releaseTag}:${path}`)) {
      throw new Error(`${name}@${version}: current package bytes differ from ${releaseTag}`);
    }
  } else if (source?.source === "github" &&
             source.repo === "Azure/azure-dev-tools" && source.path === path &&
             !source.ref && /^[0-9a-f]{40}$/.test(source.sha ?? "")) {
    revision = source.sha;
  } else {
    throw new Error(`${name}: source must use its own repo-relative path or a full public commit SHA`);
  }

  try {
    const packageManifest = JSON.parse(git("show", `${revision}:${path}/.github/plugin/plugin.json`));
    requireFile(revision, `${path}/extensions/${name}/extension.mjs`);
    if (packageManifest.name !== name || packageManifest.version !== version ||
        packageManifest.extensions !== "./extensions" ||
        !Array.isArray(packageManifest.skills) ||
        packageManifest.skills.length !== expectedSkills[name].length ||
        expectedSkills[name].some((skill) => !packageManifest.skills.includes(skill))) {
      throw new Error("plugin metadata, extension, or skills differ from marketplace entry");
    }
    for (const skill of packageManifest.skills) {
      if (!/^\.\/skills\/[a-z0-9-]+\/$/.test(skill)) {
        throw new Error(`invalid skill path: ${skill}`);
      }
      requireFile(revision, `${path}/${skill.slice(2)}SKILL.md`);
    }
  } catch (error) {
    throw new Error(`${name}@${version} (${revision}): ${error.message}`, { cause: error });
  }
  return `${name}@${version} ${releaseTag ?? revision}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = resolve(process.argv[2] ?? ".github/plugin/marketplace.json");
  try {
    for (const result of verifyMarketplace(JSON.parse(readFileSync(path, "utf8")))) {
      console.log(result);
    }
  } catch (error) {
    console.error(`Marketplace verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
