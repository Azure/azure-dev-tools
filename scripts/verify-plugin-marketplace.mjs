import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canvasProducts = [
  "azure-sre-agent",
  "azure-functions-hosted-skills",
  "azure-resources-query",
];
const builder = "canvas-authoring";
const products = [...canvasProducts, builder];
const expectedSkills = {
  "azure-sre-agent": ["./skills/azure-sre-agent-canvas/"],
  "azure-functions-hosted-skills": [
    "./skills/azure-functions-hosted-skills-canvas/",
    "./skills/azure-functions-hosted-skills-github-daily-digest/",
  ],
  "azure-resources-query": ["./skills/azure-resources-query/"],
  "canvas-authoring": ["./skills/create-canvas-app/"],
};
const reviewedSources = {
  "azure-sre-agent": {
    version: "0.2.4",
    sha: "b6acf8d7089ff45e28ff8b4d66a0571826b74a49",
  },
  "azure-functions-hosted-skills": {
    version: "0.5.1",
    sha: "2bb835480969ebf35f4d414b60c084590efb9ff6",
  },
  "azure-resources-query": {
    version: "0.1.1",
    sha: "be9551d7c65df8e728edb2bcf896a08d5b193269",
  },
  "canvas-authoring": {
    version: "0.1.0",
    sha: "23aa6b19a50aca470c759f04f5c657481f6e2d6a",
    receipt: "ae94421b2b6db7f5252b9f5b2099d2a3ff185ff2c82a8d0ebfe9f35695a0e2da",
    receiptScope: "full",
  },
};
const canvasReleaseCommit = "482188d87a3a3baf36ae3726412bc93adb310011";
const marketplaceBase = "3c85649077b4350e4b1c81df3328233d1b45877c";
const builderReleaseCommit = "5bea7baefed06b627a279da2dcc78331289598ef";

function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function isAncestor(root, ancestor, descendant) {
  try {
    git(root, "merge-base", "--is-ancestor", ancestor, descendant);
    return true;
  } catch {
    return false;
  }
}

function requireFile(root, sha, path) {
  git(root, "cat-file", "-e", `${sha}:${path}`);
}

function releaseTagFor(name, version, root) {
  const tags = git(root, "tag", "-l", `${name}-v${version.replaceAll(".", "-")}-*`)
    .split("\n").filter(Boolean);
  if (tags.length !== 1) {
    throw new Error(`${name}@${version}: expected exactly one reviewed immutable release tag`);
  }
  return tags[0];
}

function productPath(name) {
  return `${name === builder ? "plugins" : "canvases"}/${name}`;
}

function isMutableDocumentation(file) {
  const basename = file.slice(file.lastIndexOf("/") + 1);
  if (/^(?:LICENSE|LICENCE|NOTICE|COPYING|THIRD_PARTY_NOTICES)(?:[._-].*)?$/i.test(basename) ||
      basename === "SHA256SUMS" || basename === "inventory.json") {
    return false;
  }
  return /^README[^/]*$/.test(basename) || /^docs?\//.test(file);
}

function packageEntries(root, revision, path) {
  return git(root, "ls-tree", "-r", "-z", `${revision}:${path}`)
    .split("\0").filter(Boolean);
}

function protectedEntries(root, revision, path) {
  return packageEntries(root, revision, path)
    .filter((entry) => !isMutableDocumentation(entry.slice(entry.indexOf("\t") + 1)));
}

export function verifyCombinedReleaseCommits(commits, root = repoRoot) {
  if (commits.length !== canvasProducts.length ||
      new Set(commits).size !== 1 || commits[0] !== canvasReleaseCommit ||
      !isAncestor(root, canvasReleaseCommit, marketplaceBase)) {
    throw new Error("The three canvas tags must point to the reviewed public release commit");
  }
}

export function verifyBuilderReleaseCommit(commit, root = repoRoot) {
  if (commit === canvasReleaseCommit || !isAncestor(root, marketplaceBase, commit)) {
    throw new Error("Builder tag must point to a later product commit descended from public staging main");
  }
  const changed = git(root, "diff", "--name-only", marketplaceBase, commit)
    .split("\n").filter(Boolean);
  if (!changed.length || changed.some((path) => !path.startsWith("plugins/canvas-authoring/"))) {
    throw new Error("Builder product commit changed protected files outside plugins/canvas-authoring/");
  }
  if (commit !== builderReleaseCommit) {
    throw new Error("Builder tag must point to the reviewed public product merge commit");
  }
  if (!isAncestor(root, commit, "refs/remotes/origin/main")) {
    throw new Error("Builder tag must point to a product commit merged into public origin/main");
  }
}

export function verifyMarketplace(manifest, { root = repoRoot, fixture = false } = {}) {
  if (manifest.name !== (fixture ? "azure-dev-tools-fixture" : "azure-dev-tools")) {
    throw new Error("Marketplace must have the expected public name");
  }
  if (!manifest.owner?.name || !Array.isArray(manifest.plugins)) {
    throw new Error("Marketplace must have an owner and plugins array");
  }
  const names = manifest.plugins.map(({ name }) => name);
  if (names.length !== products.length || new Set(names).size !== products.length ||
      products.some((name) => !names.includes(name))) {
    throw new Error("Marketplace must contain exactly three canvas plugins and the skill-only builder");
  }
  if (!fixture && manifest.plugins.some(({ name, version }) =>
    version !== reviewedSources[name].version)) {
    throw new Error("Marketplace versions must match the four reviewed source releases");
  }

  const results = manifest.plugins.map((plugin) => verifyPlugin(plugin, root));
  if (!fixture) {
    const commits = new Map(manifest.plugins.map(({ name, version }) => [
      name, git(root, "rev-parse", `${releaseTagFor(name, version, root)}^{commit}`),
    ]));
    verifyCombinedReleaseCommits(canvasProducts.map((name) => commits.get(name)), root);
    verifyBuilderReleaseCommit(commits.get(builder), root);
    if (git(root, "rev-parse", `${builder}-latest^{commit}`) !== commits.get(builder)) {
      throw new Error("Builder latest tag must point to its immutable product commit");
    }
    if (!isAncestor(root, commits.get(builder), "HEAD")) {
      throw new Error("Refresh this branch onto the tagged builder product commit");
    }
  }
  return results;
}

export function verifyTagSource(name, version, tag) {
  if (version !== reviewedSources[name]?.version) return;
  const base = `${name}-v${version.replaceAll(".", "-")}-`;
  const suffix = tag.startsWith(base) ? tag.slice(base.length) : "";
  if (!/^[0-9a-f]{7,40}$/.test(suffix) ||
      !reviewedSources[name].sha.startsWith(suffix)) {
    throw new Error(`${name}@${version}: tag does not identify the reviewed source commit`);
  }
}

export function verifyPlugin({ source, name, version }, root = repoRoot) {
  if (!products.includes(name) || !/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error(`${name}: expected a known Azure product and numeric semantic version`);
  }
  const path = productPath(name);
  let revision;
  let releaseTag;
  if (source === path) {
    releaseTag = releaseTagFor(name, version, root);
    verifyTagSource(name, version, releaseTag);
    revision = "HEAD";
    if (protectedEntries(root, revision, path).join("\0") !==
        protectedEntries(root, releaseTag, path).join("\0")) {
      throw new Error(`${name}@${version}: current package bytes differ from ${releaseTag} outside mutable documentation`);
    }
  } else if (source?.source === "github" &&
             source.repo === "Azure/azure-dev-tools" && source.path === path &&
             !source.ref && /^[0-9a-f]{40}$/.test(source.sha ?? "")) {
    revision = source.sha;
  } else {
    throw new Error(`${name}: source must use its own repo-relative path or a full public commit SHA`);
  }

  try {
    const packageManifest = JSON.parse(git(root, "show",
      `${revision}:${path}/${name === builder ? "plugin.json" : ".github/plugin/plugin.json"}`));
    const skillFiles = git(root, "ls-tree", "-r", "--name-only", `${revision}:${path}`)
      .split("\n").filter((file) => /^skills\/[^/]+\/SKILL\.md$/.test(file));
    const expectedFiles = expectedSkills[name].map((skill) => `${skill.slice(2)}SKILL.md`);
    if (packageManifest.name !== name || packageManifest.version !== version ||
        skillFiles.length !== expectedFiles.length ||
        expectedFiles.some((file) => !skillFiles.includes(file))) {
      throw new Error("plugin metadata or contributed skills differ from marketplace entry");
    }
    if (name === builder) {
      const files = git(root, "ls-tree", "-r", "--name-only", `${revision}:${path}`)
        .split("\n").filter(Boolean);
      if ("extensions" in packageManifest || "canvases" in packageManifest ||
          files.some((file) => file.startsWith("extensions/") || file.startsWith("canvases/"))) {
        throw new Error("skill-only builder must not contribute an extension or canvas");
      }
      if (releaseTag) {
        const sums = execFileSync("git", ["show", `${releaseTag}:${path}/SHA256SUMS`], {
          cwd: root, stdio: ["ignore", "pipe", "pipe"],
        });
        const digest = createHash("sha256").update(sums).digest("hex");
        if (digest !== reviewedSources[name].receipt) {
          throw new Error("builder SHA256SUMS differs from reviewed public receipt");
        }
        const inventory = JSON.parse(git(root, "show", `${releaseTag}:${path}/inventory.json`));
        const entries = sums.toString("utf8").trimEnd().split("\n");
        const receiptScope = reviewedSources[name].receiptScope;
        if (receiptScope !== "full" && receiptScope !== "protected") {
          throw new Error("builder receipt must declare its coverage scope");
        }
        const taggedFiles = packageEntries(root, releaseTag, path)
          .map((entry) => entry.slice(entry.indexOf("\t") + 1));
        const payload = taggedFiles.filter((file) => file !== "SHA256SUMS" &&
          file !== "inventory.json" &&
          (receiptScope === "full" || !isMutableDocumentation(file)));
        if (inventory.plugin !== path || inventory.version !== version ||
            inventory.sha256 !== digest || entries.length !== payload.length ||
            Object.keys(inventory.files ?? {}).length !== payload.length) {
          throw new Error("builder inventory does not match the tagged package");
        }
        const seen = new Set();
        for (const entry of entries) {
          const match = /^([0-9a-f]{64})  (.+)$/.exec(entry);
          const file = match?.[2];
          if (!file || !payload.includes(file) || seen.has(file) ||
              inventory.files[file] !== match[1]) {
            throw new Error("builder SHA256SUMS does not match the tagged package inventory");
          }
          seen.add(file);
          const bytes = execFileSync("git", ["show", `${releaseTag}:${path}/${file}`], {
            cwd: root, stdio: ["ignore", "pipe", "pipe"],
          });
          if (createHash("sha256").update(bytes).digest("hex") !== match[1]) {
            throw new Error(`builder tagged package bytes differ from SHA256SUMS: ${file}`);
          }
        }
      }
    } else {
      requireFile(root, revision, `${path}/extensions/${name}/extension.mjs`);
      if (packageManifest.extensions !== "./extensions" ||
          !Array.isArray(packageManifest.skills) ||
          packageManifest.skills.length !== expectedSkills[name].length ||
          expectedSkills[name].some((skill) => !packageManifest.skills.includes(skill))) {
        throw new Error("plugin metadata, extension, or skills differ from marketplace entry");
      }
    }
    for (const skill of expectedSkills[name]) {
      requireFile(root, revision, `${path}/${skill.slice(2)}SKILL.md`);
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
