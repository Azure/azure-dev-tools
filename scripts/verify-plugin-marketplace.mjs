import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, posix, resolve } from "node:path";

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

function isMutableDocumentation(file, metadata, runtimeFiles) {
  const basename = file.slice(file.lastIndexOf("/") + 1);
  if (!metadata.startsWith("100644 blob ") ||
      file.startsWith("extensions/") || file.startsWith("com.github.copilot/extensions/") ||
      (/(?:^|\/)docs?\//.test(file) && !/^docs?\//.test(file)) ||
      runtimeFiles.has(file) ||
      /^(?:LICENSE|LICENCE|NOTICE|COPYING|COPYRIGHT|AUTHORS|ATTRIBUTION|PATENTS|THIRD[-_]?PARTY[-_]?NOTICES)(?:[._-].*)?$/i.test(basename) ||
      basename === "SHA256SUMS" || basename === "inventory.json") {
    return false;
  }
  const text = /(?:\.md|\.markdown|\.txt|\.rst|\.adoc)$/i;
  if (/^README(?:$|[._-])/.test(basename)) {
    return basename === "README" || text.test(basename);
  }
  return /^docs?\//.test(file) &&
    (text.test(basename) || /\.(?:png|jpe?g|gif|webp|avif)$/i.test(basename));
}

function packageEntries(root, revision, path) {
  return git(root, "ls-tree", "-r", "-z", `${revision}:${path}`)
    .split("\0").filter(Boolean);
}

function protectedEntries(root, revision, path, runtimeFiles) {
  return packageEntries(root, revision, path)
    .filter((entry) => {
      const separator = entry.indexOf("\t");
      const metadata = entry.slice(0, separator);
      const file = entry.slice(separator + 1);
      return !isMutableDocumentation(file, metadata, runtimeFiles);
    });
}

function taggedRuntimeFiles(root, tag, path, name) {
  const files = packageEntries(root, tag, path)
    .map((entry) => entry.slice(entry.indexOf("\t") + 1));
  const fileSet = new Set(files);
  const runtimeFiles = new Set();
  if (name !== builder) {
    const release = JSON.parse(git(root, "show", `${tag}:${path}/release.json`));
    if (!Array.isArray(release.modules) || !Array.isArray(release.assets)) {
      throw new Error(`${name}: tagged runtime file inventory is missing`);
    }
    for (const { file } of [...release.modules, ...release.assets]) runtimeFiles.add(file);
  }
  for (const script of files.filter((file) => /\.(?:mjs|cjs|js|jsx|ts|tsx|py|sh)$/i.test(file))) {
    const source = git(root, "show", `${tag}:${path}/${script}`);
    for (const [, literal] of source.matchAll(/["'`]([^"'`\n]+)["'`]/g)) {
      const target = literal.split(/[?#]/, 1)[0];
      if (!target.startsWith("./") && !target.startsWith("../") && !target.includes("/")) continue;
      const resolved = target.startsWith("./") || target.startsWith("../")
        ? posix.normalize(posix.join(posix.dirname(script), target))
        : target;
      if (fileSet.has(resolved)) runtimeFiles.add(resolved);
    }
  }
  return runtimeFiles;
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

export function verifyMarketplace(manifest, { root = repoRoot, fixture = false, revision = "HEAD" } = {}) {
  if (manifest.name !== (fixture ? "azure-dev-tools-fixture" : "azure-dev-tools")) {
    throw new Error("Marketplace must have the expected public name");
  }
  if (!manifest.owner?.name || !Array.isArray(manifest.plugins)) {
    throw new Error("Marketplace must have an owner and plugins array");
  }
  const pins = fixture ? [] : pinnedCandidates(root, revision);
  const names = manifest.plugins.map(({ name }) => name);
  if (new Set(names).size !== names.length ||
      products.some((name) => !names.includes(name)) ||
      names.some((name) => !products.includes(name) &&
        !pins.some((pin) => pin.name === name))) {
    throw new Error("Marketplace must retain three reviewed canvases and the skill-only builder; new canvases need pins");
  }
  if (!fixture && manifest.plugins.some(({ name, version }) =>
    version !== reviewedSources[name]?.version &&
    !pins.some((pin) => pin.name === name && pin.version === version))) {
    throw new Error("Marketplace versions must match the four reviewed source releases");
  }

  const results = manifest.plugins.map((plugin) => {
    const pin = pins.find(({ name }) => name === plugin.name &&
      plugin.version !== reviewedSources[name]?.version);
    const result = verifyPlugin(plugin, root, revision, pin);
    if (pin) {
      const tag = releaseTagFor(plugin.name, plugin.version, root);
      candidatePackage(plugin, pin, root, tag);
      const commit = git(root, "rev-parse", `${tag}^{commit}`);
      const previousPath = `${productPath(plugin.name)}/.github/plugin/plugin.json`;
      const previous = git(root, "ls-tree", "--name-only", `${commit}^`, "--", previousPath)
        ? JSON.parse(git(root, "show", `${commit}^:${previousPath}`)) : null;
      if (!isAncestor(root, commit, "refs/remotes/origin/main") ||
          !isAncestor(root, commit, revision) || previous?.version === plugin.version) {
        throw new Error(`${plugin.name}: new immutable tag must identify the merged product-version commit`);
      }
      if (git(root, "rev-parse", `${plugin.name}-latest^{commit}`) !== commit) {
        throw new Error(`${plugin.name}: latest tag must match its immutable release commit`);
      }
    }
    return result;
  });
  if (!fixture) {
    const historicalCommits = canvasProducts.map((name) =>
      git(root, "rev-parse", `${releaseTagFor(name, reviewedSources[name].version, root)}^{commit}`));
    for (const name of canvasProducts) {
      verifyTagSource(name, reviewedSources[name].version,
        releaseTagFor(name, reviewedSources[name].version, root));
    }
    verifyCombinedReleaseCommits(historicalCommits, root);
    const builderCommit = git(root, "rev-parse",
      `${releaseTagFor(builder, reviewedSources[builder].version, root)}^{commit}`);
    verifyBuilderReleaseCommit(builderCommit, root);
    if (git(root, "rev-parse", `${builder}-latest^{commit}`) !== builderCommit) {
      throw new Error("Builder latest tag must point to its immutable product commit");
    }
    if (!isAncestor(root, builderCommit, revision)) {
      throw new Error("Refresh this branch onto the tagged builder product commit");
    }
  }
  return results;
}

export function verifyTagSource(name, version, tag, pin) {
  if (!pin && version !== reviewedSources[name]?.version) return;
  const sourceSha = pin?.sourceSha ?? reviewedSources[name]?.sha;
  if (!sourceSha) throw new Error(`${name}: missing approved source SHA`);
  const base = `${name}-v${version.replaceAll(".", "-")}-`;
  const suffix = tag.startsWith(base) ? tag.slice(base.length) : "";
  if (!/^[0-9a-f]{7,40}$/.test(suffix) ||
      !sourceSha.startsWith(suffix)) {
    throw new Error(`${name}@${version}: tag does not identify the reviewed source commit`);
  }
}

export function verifyPlugin({ source, name, version }, root = repoRoot, currentRevision = "HEAD", sourcePin) {
  if ((!products.includes(name) && sourcePin?.name !== name) ||
      !/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error(`${name}: expected a known Azure product and numeric semantic version`);
  }
  const path = productPath(name);
  let revision;
  let releaseTag;
  if (source === path) {
    releaseTag = releaseTagFor(name, version, root);
    verifyTagSource(name, version, releaseTag, sourcePin);
    revision = currentRevision;
    const runtimeFiles = taggedRuntimeFiles(root, releaseTag, path, name);
    if (protectedEntries(root, revision, path, runtimeFiles).join("\0") !==
        protectedEntries(root, releaseTag, path, runtimeFiles).join("\0")) {
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
    const skills = sourcePin?.skills ?? expectedSkills[name];
    const expectedFiles = skills.map((skill) => `${skill.slice(2)}SKILL.md`);
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
        const payload = packageEntries(root, releaseTag, path)
          .filter((entry) => {
            const separator = entry.indexOf("\t");
            const metadata = entry.slice(0, separator);
            const file = entry.slice(separator + 1);
            return file !== "SHA256SUMS" && file !== "inventory.json" &&
              (receiptScope === "full" ||
               !isMutableDocumentation(file, metadata, new Set()));
          })
          .map((entry) => entry.slice(entry.indexOf("\t") + 1));
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
      const extensionDir = sourcePin
        ? `com.github.copilot/extensions/${name}` : `extensions/${name}`;
      requireFile(root, revision, `${path}/${extensionDir}/extension.mjs`);
      if ((sourcePin
        ? packageManifest.extensions?.["com.github.copilot"]?.logo !== sourcePin.logoPath
        : packageManifest.extensions !== "./extensions") ||
          !Array.isArray(packageManifest.skills) ||
          packageManifest.skills.length !== skills.length ||
          skills.some((skill) => !packageManifest.skills.includes(skill))) {
        throw new Error("plugin metadata, extension, or skills differ from marketplace entry");
      }
    }
    for (const skill of skills) {
      requireFile(root, revision, `${path}/${skill.slice(2)}SKILL.md`);
    }
  } catch (error) {
    throw new Error(`${name}@${version} (${revision}): ${error.message}`, { cause: error });
  }
  return `${name}@${version} ${releaseTag ?? revision}`;
}

const pinPath = ".github/plugin/marketplace-candidate-pins.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function pinnedCandidates(root, revision) {
  if (git(root, "ls-tree", "--name-only", revision, "--", pinPath) !== pinPath) return [];
  const pins = JSON.parse(git(root, "show", `${revision}:${pinPath}`));
  if (pins.schemaVersion !== 1 || !Array.isArray(pins.products) ||
      new Set(pins.products.map((pin) => pin.name)).size !== pins.products.length ||
      pins.products.some((pin) => !/^azure-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pin.name ?? "") ||
        pin.name === builder ||
        !/^\d+\.\d+\.\d+$/.test(pin.version ?? "") ||
        !/^[0-9a-f]{40}$/.test(pin.sourceSha ?? "") ||
        !/^[0-9a-f]{64}$/.test(pin.receiptSha256 ?? "") ||
        !/^[0-9a-f]{64}$/.test(pin.inventorySha256 ?? "") ||
        pin.logoPath !== "assets/preview.png" ||
        !/^[0-9a-f]{64}$/.test(pin.logoSha256 ?? "") ||
        !/^[0-9a-f]{64}$/.test(pin.heroSha256 ?? "") ||
        !Array.isArray(pin.skills) || pin.skills.length === 0 ||
        new Set(pin.skills).size !== pin.skills.length ||
        pin.skills.some((skill) => !/^\.[/]skills[/][a-z0-9-]+[/]$/.test(skill)) ||
        !/^docs\/[a-zA-Z0-9-]+\.(?:png|jpe?g|gif|webp|avif)$/.test(pin.heroPath ?? ""))) {
    throw new Error("Candidate pins must identify distinct canvas versions, full source SHAs, and separate logo/hero digests");
  }
  return pins.products;
}

function newerVersion(next, previous) {
  const nextParts = next.split(".").map(Number);
  const previousParts = previous.split(".").map(Number);
  return nextParts.some((part, index) => part > previousParts[index] &&
    nextParts.slice(0, index).every((value, earlier) => value === previousParts[earlier]));
}

function candidatePackage(plugin, pin, root, revision = "HEAD") {
  const { name, version } = plugin;
  const path = productPath(name);
  if (plugin.source !== path || version !== pin.version) {
    throw new Error(`${name}: candidate must use the pinned version and repo-relative source`);
  }
  verifyPlugin({ ...plugin, source: {
    source: "github", repo: "Azure/azure-dev-tools", path,
    sha: git(root, "rev-parse", `${revision}^{commit}`),
  } }, root, revision, pin);
  const entries = packageEntries(root, revision, path);
  const files = entries.map((entry) => entry.slice(entry.indexOf("\t") + 1));
  if (entries.some((entry) => !/^100(?:644|755) blob /.test(entry))) {
    throw new Error(`${name}: candidate package contains a symlink, submodule, or nonregular file`);
  }
  const required = ["README.md", "release.json", "checksums.json", "SHA256SUMS", "inventory.json",
    "package.json", pin.logoPath, pin.heroPath];
  if (required.some((file) => !files.includes(file))) {
    throw new Error(`${name}: candidate package is missing a release artifact`);
  }
  const read = (file) => execFileSync("git", ["show", `${revision}:${path}/${file}`], {
    cwd: root, stdio: ["ignore", "pipe", "pipe"],
  });
  const release = JSON.parse(read("release.json"));
  const checksums = JSON.parse(read("checksums.json"));
  const sums = read("SHA256SUMS");
  const inventoryBytes = read("inventory.json");
  const inventory = JSON.parse(inventoryBytes);
  const receiptDigest = sha256(sums);
  if (sha256(read(pin.logoPath)) !== pin.logoSha256) {
    throw new Error(`${name}: candidate plugin logo differs from the approved pin`);
  }
  const readme = read("README.md").toString("utf8");
  if (sha256(read(pin.heroPath)) !== pin.heroSha256 ||
      !readme.includes(`](${pin.heroPath})`)) {
    throw new Error(`${name}: candidate README hero image differs from the approved pin`);
  }
  if (receiptDigest !== pin.receiptSha256 ||
      sha256(inventoryBytes) !== pin.inventorySha256 ||
      inventory.plugin !== path || inventory.version !== version ||
      inventory.sourceSha !== pin.sourceSha || inventory.scope !== "protected" ||
      inventory.sha256 !== receiptDigest) {
    throw new Error(`${name}: candidate receipt, inventory, or approved source SHA differs from the base pin`);
  }
  const payload = files.filter((file) =>
    !["release.json", "checksums.json", "SHA256SUMS", "inventory.json"].includes(file));
  const packageJson = JSON.parse(read("package.json"));
  const extensionDir = `com.github.copilot/extensions/${name}`;
  if (release.name !== name || release.version !== version ||
      packageJson.name !== name || packageJson.version !== version ||
      release.plugin?.preview?.file !== pin.logoPath ||
      release.plugin?.extension?.directory !== extensionDir ||
      release.plugin?.extension?.entry !== `${extensionDir}/extension.mjs` ||
      !Array.isArray(release.files) || new Set(release.files).size !== payload.length ||
      payload.some((file) => !release.files.includes(file))) {
    throw new Error(`${name}: candidate release inventory does not cover the package`);
  }
  const checked = [...payload, "release.json"];
  if (Object.keys(checksums).length !== checked.length ||
      checked.some((file) => checksums[file] !== sha256(read(file)))) {
    throw new Error(`${name}: candidate checksums do not match package bytes`);
  }
  const runtimeFiles = taggedRuntimeFiles(root, revision, path, name);
  const protectedFiles = protectedEntries(root, revision, path, runtimeFiles)
    .map((entry) => entry.slice(entry.indexOf("\t") + 1))
    .filter((file) => file !== "SHA256SUMS" && file !== "inventory.json");
  const lines = sums.toString("utf8").trimEnd().split("\n");
  const received = new Map();
  for (const line of lines) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
    if (!match || received.has(match[2]) || !protectedFiles.includes(match[2])) {
      throw new Error(`${name}: candidate SHA256SUMS has invalid or unexpected entries`);
    }
    received.set(match[2], match[1]);
  }
  if (received.size !== protectedFiles.length ||
      Object.keys(inventory.files ?? {}).length !== protectedFiles.length ||
      !protectedFiles.includes(pin.logoPath) ||
      protectedFiles.some((file) => received.get(file) !== sha256(read(file)) ||
        inventory.files[file] !== received.get(file))) {
    throw new Error(`${name}: candidate protected files do not match the approved receipt`);
  }
  if (!/^# [^\n]+\n\n\S/m.test(readme) || !/^## Install\b/m.test(readme) ||
      !/^## (?:Try it|Quickstart|First run)\b/m.test(readme) ||
      !/\bOpen (?:the )?.*canvas\b/i.test(readme) ||
      [...readme.matchAll(/\]\((docs\/[^)#?]+\.md)\)/g)].some(([, file]) =>
        !files.includes(file))) {
    throw new Error(`${name}: packaged customer README is missing required install or quickstart guidance`);
  }
  return `${name}@${version} candidate ${pin.sourceSha} ${receiptDigest}`;
}

export function verifyMarketplaceCandidate(manifest, { root = repoRoot, base } = {}) {
  if (!/^[0-9a-f]{40}$/.test(base ?? "") || !isAncestor(root, base, "HEAD")) {
    throw new Error("Candidate verification requires the full PR base SHA, ancestor of HEAD");
  }
  const baseManifest = JSON.parse(git(root, "show", `${base}:.github/plugin/marketplace.json`));
  verifyMarketplace(baseManifest, { root, revision: base });
  const pins = pinnedCandidates(root, base);
  pinnedCandidates(root, "HEAD");
  if (manifest.name !== "azure-dev-tools" || !manifest.owner?.name ||
      !Array.isArray(manifest.plugins) ||
      new Set(manifest.plugins.map((plugin) => plugin.name)).size !== manifest.plugins.length ||
      products.some((name) => !manifest.plugins.some((plugin) => plugin.name === name)) ||
      manifest.plugins.some(({ name }) => !products.includes(name) &&
        !pins.some((pin) => pin.name === name))) {
    throw new Error("Candidate marketplace must retain the four reviewed public products; additions need base pins");
  }
  const changedProducts = [];
  const results = manifest.plugins.map((plugin) => {
    const previous = baseManifest.plugins.find(({ name }) => name === plugin.name);
    if (previous && plugin.version === previous.version) {
      if (JSON.stringify(plugin) !== JSON.stringify(previous)) {
        throw new Error(`${plugin.name}: unchanged version must retain its catalog entry`);
      }
      return verifyPlugin(plugin, root);
    }
    const pin = pins.find(({ name }) => name === plugin.name);
    if (!pin || previous && !newerVersion(plugin.version, previous.version)) {
      throw new Error(`${plugin.name}: new version requires an independently approved base pin`);
    }
    changedProducts.push(plugin.name);
    return candidatePackage(plugin, pin, root);
  });
  if (changedProducts.length &&
      git(root, "rev-parse", `${base}:${pinPath}`) !==
      git(root, "rev-parse", `HEAD:${pinPath}`)) {
    throw new Error("Candidate PR cannot change its own approved base pins");
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, base] = process.argv.slice(2);
    if (mode && mode !== "--candidate" || mode === "--candidate" && (!base || process.argv.length !== 4)) {
      throw new Error("Usage: node scripts/verify-plugin-marketplace.mjs [--candidate <PR-base-full-SHA>]");
    }
    const manifest = JSON.parse(readFileSync(resolve(".github/plugin/marketplace.json"), "utf8"));
    for (const result of mode === "--candidate"
      ? verifyMarketplaceCandidate(manifest, { base })
      : verifyMarketplace(manifest)) {
      console.log(result);
    }
  } catch (error) {
    console.error(`Marketplace verification failed: ${error.message}`);
    process.exitCode = 1;
  }
}
