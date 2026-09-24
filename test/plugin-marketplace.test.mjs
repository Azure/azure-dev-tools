import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  verifyBuilderReleaseCommit,
  verifyCombinedReleaseCommits,
  verifyMarketplace,
  verifyMarketplaceCandidate,
  verifyPlugin,
  verifyTagSource,
} from "../scripts/verify-plugin-marketplace.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(new URL("./fixtures/marketplace.candidate.json", import.meta.url)));
const publicManifest = JSON.parse(readFileSync(new URL("../.github/plugin/marketplace.json", import.meta.url)));
const candidate = "5bea7baefed06b627a279da2dcc78331289598ef";
const publicMainAtBranch = "4b265a1f54d60a7f8fee8bbc0c2052f03de73633";
const tag = "canvas-authoring-v0-1-0-23aa6b1";
const receipt = "ae94421b2b6db7f5252b9f5b2099d2a3ff185ff2c82a8d0ebfe9f35695a0e2da";

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function withClone(callback) {
  const directory = mkdtempSync(join(tmpdir(), "canvas-marketplace-test-"));
  try {
    git(root, "clone", "--quiet", "--local", "--no-hardlinks", root, directory);
    git(directory, "config", "user.email", "fixture@example.invalid");
    git(directory, "config", "user.name", "Marketplace fixture");
    return callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function withoutBuilderTags(directory) {
  const tags = git(directory, "tag", "-l", "canvas-authoring-v0-1-0-*")
    .split("\n").filter(Boolean);
  if (tags.length) git(directory, "tag", "-d", ...tags);
  if (git(directory, "tag", "-l", "canvas-authoring-latest")) {
    git(directory, "tag", "-d", "canvas-authoring-latest");
  }
}

function withFixture(callback) {
  return withClone((directory) => {
    const plugin = join(directory, "plugins/canvas-authoring");
    mkdirSync(join(plugin, "skills/create-canvas-app"), { recursive: true });
    writeFileSync(join(plugin, "plugin.json"), JSON.stringify({
      name: "canvas-authoring", version: "0.1.0",
      description: "Synthetic fixture, not a release",
    }));
    writeFileSync(join(plugin, "skills/create-canvas-app/SKILL.md"), "---\nname: create-canvas-app\n---\n");
    git(directory, "add", "plugins/canvas-authoring");
    git(directory, "commit", "--quiet", "-m", "Synthetic skill-only fixture");
    const manifest = structuredClone(fixture);
    manifest.plugins[3].source.sha = git(directory, "rev-parse", "HEAD");
    return callback(directory, manifest);
  });
}

function changed(manifest, update) {
  const clone = structuredClone(manifest);
  update(clone);
  return clone;
}

function withReviewedPublicMain(directory) {
  git(directory, "merge-base", "--is-ancestor", candidate, publicMainAtBranch);
  git(directory, "update-ref", "refs/remotes/origin/main", publicMainAtBranch);
}

function withApprovedCandidate(callback) {
  return withClone((directory) => {
    withReviewedPublicMain(directory);
    const name = "azure-sre-agent";
    const path = `canvases/${name}`;
    const heroPath = `extensions/${name}/assets/preview.png`;
    const sourceSha = "a".repeat(40);
    const version = "0.2.5";
    const updateJson = (file, update) => {
      const fullPath = join(directory, path, file);
      const json = JSON.parse(readFileSync(fullPath, "utf8"));
      update(json);
      writeFileSync(fullPath, `${JSON.stringify(json, null, 2)}\n`);
    };
    updateJson(".github/plugin/plugin.json", (json) => { json.version = version; });
    updateJson("package.json", (json) => { json.version = version; });
    updateJson(`extensions/${name}/studio-package.json`, (json) => { json.version = version; });
    updateJson("release.json", (json) => {
      json.version = version;
      json.files.push(heroPath);
    });
    const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
    const hero = join(directory, path, heroPath);
    writeFileSync(hero, "synthetic approved image bytes\n");
    const heroSha256 = digest(readFileSync(hero));
    const readme = join(directory, path, "README.md");
    writeFileSync(readme, readFileSync(readme, "utf8").replace(
      "Diagnose failing Azure applications with an existing Azure SRE Agent.",
      `Diagnose failing Azure applications with an existing Azure SRE Agent.\n\n![SRE icon](${heroPath})`,
    ));
    const checksumFile = join(directory, path, "checksums.json");
    const release = JSON.parse(readFileSync(join(directory, path, "release.json"), "utf8"));
    const checksums = {};
    for (const file of [...release.files, "release.json"]) {
      checksums[file] = digest(readFileSync(join(directory, path, file)));
    }
    writeFileSync(checksumFile, `${JSON.stringify(checksums, null, 2)}\n`);
    const payload = [...release.files, "release.json", "checksums.json"]
      .filter((file) => file !== "README.md");
    const files = Object.fromEntries(payload.map((file) =>
      [file, digest(readFileSync(join(directory, path, file)))]));
    const sums = payload.map((file) => `${files[file]}  ${file}`).join("\n") + "\n";
    writeFileSync(join(directory, path, "SHA256SUMS"), sums);
    const receiptSha256 = digest(Buffer.from(sums));
    const inventory = {
      plugin: path, version, sourceSha, scope: "protected",
      sha256: receiptSha256, files,
    };
    const inventoryBytes = `${JSON.stringify(inventory, null, 2)}\n`;
    writeFileSync(join(directory, path, "inventory.json"), inventoryBytes);
    git(directory, "add", path);
    git(directory, "commit", "--quiet", "-m", "Synthetic candidate package");
    const artifactCommit = git(directory, "rev-parse", "HEAD");
    const startingCommit = git(directory, "rev-parse", "HEAD^");
    git(directory, "checkout", "--quiet", "-b", "approved-pins", startingCommit);
    const pin = {
      name, version, sourceSha, receiptSha256,
      inventorySha256: digest(Buffer.from(inventoryBytes)),
      heroPath, heroSha256, skills: ["./skills/azure-sre-agent-canvas/"],
    };
    const pinPath = join(directory, ".github/plugin/marketplace-candidate-pins.json");
    writeFileSync(pinPath, `${JSON.stringify({ schemaVersion: 1, products: [pin] }, null, 2)}\n`);
    git(directory, "add", pinPath);
    git(directory, "commit", "--quiet", "-m", "Separately approve source and artifact pins");
    const base = git(directory, "rev-parse", "HEAD");
    git(directory, "cherry-pick", "--quiet", artifactCommit);
    const manifest = structuredClone(publicManifest);
    manifest.plugins[0].version = version;
    writeFileSync(join(directory, ".github/plugin/marketplace.json"),
      `${JSON.stringify(manifest, null, 2)}\n`);
    git(directory, "add", ".github/plugin/marketplace.json");
    git(directory, "commit", "--quiet", "-m", "Point marketplace at approved new package");
    return callback(directory, base, manifest, pin);
  });
}

function withApprovedNewCanvas(callback) {
  return withClone((directory) => {
    withReviewedPublicMain(directory);
    const name = "azure-new-canvas";
    const version = "0.1.0";
    const sourceSha = "c".repeat(40);
    const path = `canvases/${name}`;
    const heroPath = `extensions/${name}/assets/preview.png`;
    const skill = `./skills/${name}/`;
    const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
    const write = (file, value) => {
      const full = join(directory, path, file);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, value);
    };
    const read = (file) => readFileSync(join(directory, path, file));
    const json = (file, value) => write(file, `${JSON.stringify(value, null, 2)}\n`);
    json(".github/plugin/plugin.json", { name, version, extensions: "./extensions", skills: [skill] });
    json("package.json", { name, version });
    write(`extensions/${name}/extension.mjs`, "export const canvas = true;\n");
    write(heroPath, "approved raster icon\n");
    write(`skills/${name}/SKILL.md`, `---\nname: ${name}\n---\n`);
    write("README.md", `# Azure New Canvas

Browse Azure resources safely.

![New canvas logo](${heroPath})

## Install

https://github.com/Azure/azure-dev-tools/tree/${name}-latest/canvases/${name}/extensions/${name}
https://github.com/Azure/azure-dev-tools/blob/${name}-latest/canvases/${name}/README.md

Open Azure New Canvas canvas

## Prerequisites

Use a supported host.

## Quickstart

1. Open the canvas.

## Troubleshooting

Restart the host.

## Safety

Review Azure scope before running queries.
`);
    const files = [
      ".github/plugin/plugin.json", "package.json", "README.md",
      `extensions/${name}/extension.mjs`, heroPath, `skills/${name}/SKILL.md`,
    ];
    json("release.json", { name, version, modules: [], assets: [], files });
    const checksums = Object.fromEntries([...files, "release.json"].map((file) =>
      [file, digest(read(file))]));
    json("checksums.json", checksums);
    const protectedFiles = [...files.filter((file) => file !== "README.md"),
      "release.json", "checksums.json"];
    const hashes = Object.fromEntries(protectedFiles.map((file) => [file, digest(read(file))]));
    const sums = protectedFiles.map((file) => `${hashes[file]}  ${file}`).join("\n") + "\n";
    write("SHA256SUMS", sums);
    const receiptSha256 = digest(Buffer.from(sums));
    const inventory = {
      plugin: path, version, sourceSha, scope: "protected",
      sha256: receiptSha256, files: hashes,
    };
    const inventoryBytes = `${JSON.stringify(inventory, null, 2)}\n`;
    write("inventory.json", inventoryBytes);
    git(directory, "add", path);
    git(directory, "commit", "--quiet", "-m", "Synthetic new canvas package");
    const artifactCommit = git(directory, "rev-parse", "HEAD");
    git(directory, "checkout", "--quiet", "-b", "approved-new-canvas",
      git(directory, "rev-parse", "HEAD^"));
    const pin = {
      name, version, sourceSha, receiptSha256,
      inventorySha256: digest(Buffer.from(inventoryBytes)),
      heroPath, heroSha256: digest(Buffer.from("approved raster icon\n")),
      skills: [skill],
    };
    writeFileSync(join(directory, ".github/plugin/marketplace-candidate-pins.json"),
      `${JSON.stringify({ schemaVersion: 1, products: [pin] }, null, 2)}\n`);
    git(directory, "add", ".github/plugin/marketplace-candidate-pins.json");
    git(directory, "commit", "--quiet", "-m", "Independently approve new product source");
    const base = git(directory, "rev-parse", "HEAD");
    git(directory, "cherry-pick", "--quiet", artifactCommit);
    const manifest = structuredClone(publicManifest);
    manifest.plugins.push({ name, version, source: path });
    writeFileSync(join(directory, ".github/plugin/marketplace.json"),
      `${JSON.stringify(manifest, null, 2)}\n`);
    git(directory, "add", ".github/plugin/marketplace.json");
    git(directory, "commit", "--quiet", "-m", "List approved new canvas candidate");
    return callback(directory, base, manifest);
  });
}

test("merged 28-file builder package has the reviewed public receipt", () => {
  const path = "plugins/canvas-authoring";
  const files = git(root, "ls-tree", "-r", "--name-only", candidate, "--", path)
    .split("\n").filter(Boolean);
  const sums = execFileSync("git", ["show", `${candidate}:${path}/SHA256SUMS`], { cwd: root });
  const inventory = JSON.parse(git(root, "show", `${candidate}:${path}/inventory.json`));
  assert.equal(files.length, 28);
  assert.match(verifyPlugin(publicManifest.plugins[3]), /canvas-authoring@0\.1\.0/);
  assert.equal(createHash("sha256").update(sums).digest("hex"), receipt);
  assert.equal(inventory.sha256, receipt);
  assert.equal(Object.keys(inventory.files).length, 26);
  assert.equal(fixture.plugins[3].source.sha, candidate);
});

test("fixture accepts three extension-bearing plugins plus one skill-only builder", () => {
  withFixture((directory, manifest) => {
    const results = verifyMarketplace(manifest, { root: directory, fixture: true });
    assert.equal(results.length, 4);
    assert.match(results[0], /azure-sre-agent@0\.2\.3 af40b92/);
    assert.match(results[3], /canvas-authoring@0\.1\.0/);
  });
});

test("rejects missing, duplicate, or unknown products", () => {
  withFixture((directory, manifest) => {
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => m.plugins.pop()), { root: directory, fixture: true }),
      /retain three reviewed canvases and the skill-only builder/);
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => {
      m.plugins[3] = structuredClone(m.plugins[0]);
    }), { root: directory, fixture: true }), /retain three reviewed canvases and the skill-only builder/);
  });
});

test("rejects mutable refs, external repos, mismatched metadata, and unexpected extensions", () => {
  withFixture((directory, manifest) => {
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => {
      delete m.plugins[0].source.sha;
      m.plugins[0].source.ref = "main";
    }), { root: directory, fixture: true }), /repo-relative path or a full public commit SHA/);
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => {
      m.plugins[3].source.repo = "example/private";
    }), { root: directory, fixture: true }), /repo-relative path or a full public commit SHA/);
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => {
      m.plugins[3].source.path = "canvases/canvas-authoring";
    }), { root: directory, fixture: true }), /repo-relative path or a full public commit SHA/);
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => {
      m.plugins[3].version = "0.2.0";
    }), { root: directory, fixture: true }), /plugin metadata or contributed skills differ/);
    const plugin = join(directory, "plugins/canvas-authoring");
    writeFileSync(join(plugin, "plugin.json"), JSON.stringify({
      name: "canvas-authoring", version: "0.1.0", extensions: "./extensions",
    }));
    git(directory, "add", "plugins/canvas-authoring");
    git(directory, "commit", "--quiet", "-m", "Synthetic invalid extension fixture");
    manifest.plugins[3].source.sha = git(directory, "rev-parse", "HEAD");
    assert.throws(() => verifyMarketplace(manifest, { root: directory, fixture: true }),
      /must not contribute an extension or canvas/);
  });
});

test("repo-relative source rejects absent or drifted release tags", () => {
  assert.throws(() => verifyPlugin({
    name: "azure-sre-agent", version: "0.2.3", source: "canvases/azure-sre-agent",
  }), /current package bytes differ/);
  assert.throws(() => verifyPlugin({
    name: "azure-resources-query", version: "0.1.0", source: "canvases/azure-resources-query",
  }), /exactly one reviewed immutable release tag/);
  withClone((directory) => {
    withoutBuilderTags(directory);
    git(directory, "tag", tag, candidate);
    git(directory, "tag", "canvas-authoring-latest", candidate);
    git(directory, "update-ref", "refs/remotes/origin/main", "HEAD");
    assert.equal(verifyMarketplace(publicManifest, { root: directory }).length, 4);
    withoutBuilderTags(directory);
    assert.throws(() => verifyMarketplace(publicManifest, { root: directory }),
      /canvas-authoring@0\.1\.0: expected exactly one reviewed immutable release tag/);
  });
  assert.throws(() => verifyMarketplace(fixture), /expected public name/);
});

test("main-only README and doc(s) changes, including images, do not need new tags or receipts", () => {
  withClone((directory) => {
    const paths = [
      "canvases/azure-sre-agent/README.md",
      "canvases/azure-sre-agent/README.install.md",
      "canvases/azure-functions-hosted-skills/README.md",
      "canvases/azure-resources-query/docs/resources-fixture.png",
      "canvases/azure-resources-query/doc/new-guide.md",
      "plugins/canvas-authoring/README.md",
      "plugins/canvas-authoring/skills/create-canvas-app/references/toolkit/README.md",
      "plugins/canvas-authoring/docs/new-image.webp",
    ];
    for (const path of paths) {
      const file = join(directory, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `Updated documentation: ${path}\n`);
    }
    git(directory, "add", ...paths);
    git(directory, "commit", "--quiet", "-m", "Update marketplace documentation only");
    git(directory, "rm", "--quiet", "canvases/azure-resources-query/docs/resources-fixture.png");
    git(directory, "commit", "--quiet", "-m", "Remove obsolete documentation image");
    git(directory, "update-ref", "refs/remotes/origin/main", publicMainAtBranch);
    assert.equal(git(directory, "merge-base", "HEAD", "refs/remotes/origin/main"),
      publicMainAtBranch);
    assert.notEqual(git(directory, "rev-parse", "HEAD:plugins/canvas-authoring"),
      git(directory, "rev-parse", `${tag}:plugins/canvas-authoring`));
    assert.equal(verifyMarketplace(publicManifest, { root: directory }).length, 4);
    assert.equal(git(directory, "rev-parse", `${tag}^{commit}`), candidate);
  });
});

test("the historical full receipt still rejects tampered tagged documentation", () => {
  withClone((directory) => {
    withoutBuilderTags(directory);
    const path = "plugins/canvas-authoring/README.md";
    writeFileSync(join(directory, path), "Changed historical documentation\n");
    git(directory, "add", path);
    git(directory, "commit", "--quiet", "-m", "Tamper with historical tagged documentation");
    git(directory, "tag", tag);
    assert.throws(() => verifyPlugin(publicManifest.plugins[3], directory),
      /builder tagged package bytes differ from SHA256SUMS: README\.md/);
  });
});

test("runtime, skills, manifests, legal notices, and receipts remain protected", () => {
  const paths = [
    ["canvases/azure-resources-query/extensions/azure-resources-query/extension.mjs", 2],
    ["canvases/azure-resources-query/skills/azure-resources-query/SKILL.md", 2],
    ["canvases/azure-resources-query/.github/plugin/plugin.json", 2],
    ["canvases/azure-resources-query/docs/THIRD_PARTY_NOTICES.txt", 2],
    ["canvases/azure-resources-query/docs/COPYRIGHT.md", 2],
    ["canvases/azure-resources-query/docs/AUTHORS.md", 2],
    ["canvases/azure-resources-query/docs/ATTRIBUTION.md", 2],
    ["canvases/azure-resources-query/docs/PATENTS.txt", 2],
    ["canvases/azure-functions-hosted-skills/THIRD_PARTY_NOTICES.txt", 1],
    ["plugins/canvas-authoring/skills/create-canvas-app/references/toolkit/LICENSE", 3],
    ["plugins/canvas-authoring/SHA256SUMS", 3],
    ["plugins/canvas-authoring/inventory.json", 3],
    ["canvases/azure-resources-query/README.js", 2],
    ["canvases/azure-resources-query/docs/README.mjs", 2],
    ["canvases/azure-resources-query/docs/index.html", 2],
    ["canvases/azure-resources-query/docs/active.svg", 2],
    ["canvases/azure-resources-query/docs/script.js", 2],
    ["canvases/azure-resources-query/docs/config.json", 2],
    ["canvases/azure-resources-query/docs/README.md\t.js", 2],
    ["canvases/azure-resources-query/extensions/azure-resources-query/README.md", 2],
    ["canvases/azure-resources-query/extensions/azure-resources-query/docs/screenshot.png", 2],
    ["plugins/canvas-authoring/skills/create-canvas-app/docs/nested.png", 3],
    ["plugins/canvas-authoring/skills/create-canvas-app/docs/README.md", 3],
  ];
  for (const [path, pluginIndex] of paths) {
    withClone((directory) => {
      const file = join(directory, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `Changed protected file: ${path}\n`);
      git(directory, "add", path);
      git(directory, "commit", "--quiet", "-m", "Change protected package file");
      assert.throws(() => verifyPlugin(publicManifest.plugins[pluginIndex], directory),
        /current package bytes differ.*outside mutable documentation/, path);
    });
  }
});

test("symlinks and executable documentation cannot bypass the immutable tag", () => {
  for (const kind of ["symlink", "executable", "submodule"]) {
    withClone((directory) => {
      const path = "canvases/azure-resources-query/docs/guide.md";
      const file = join(directory, path);
      mkdirSync(dirname(file), { recursive: true });
      if (kind === "symlink") {
        symlinkSync("../.github/plugin/plugin.json", file);
      } else if (kind === "executable") {
        writeFileSync(file, "Executable documentation\n");
      }
      if (kind === "submodule") {
        git(directory, "update-index", "--add", "--cacheinfo", "160000", candidate, path);
      } else {
        git(directory, "add", path);
      }
      if (kind === "executable") git(directory, "update-index", "--chmod=+x", path);
      git(directory, "commit", "--quiet", "-m", "Add unsafe documentation");
      assert.throws(() => verifyPlugin(publicManifest.plugins[2], directory),
        /current package bytes differ.*outside mutable documentation/, kind);
    });
  }
});

test("deleting a protected package file still fails", () => {
  for (const [path, index] of [
    ["canvases/azure-functions-hosted-skills/THIRD_PARTY_NOTICES.txt", 1],
    ["canvases/azure-resources-query/extensions/azure-resources-query/extension.mjs", 2],
    ["plugins/canvas-authoring/skills/create-canvas-app/SKILL.md", 3],
  ]) {
    withClone((directory) => {
      git(directory, "rm", "--quiet", path);
      git(directory, "commit", "--quiet", "-m", "Remove protected package file");
      assert.throws(() => verifyPlugin(publicManifest.plugins[index], directory),
        /current package bytes differ.*outside mutable documentation/, path);
    });
  }
});

test("runtime-declared and directly referenced documentation assets remain pinned", () => {
  for (const kind of ["declared", "referenced"]) {
    withClone((directory) => {
      const path = kind === "declared"
        ? "canvases/azure-resources-query/release.json"
        : "canvases/azure-resources-query/extensions/azure-resources-query/extension.mjs";
      if (kind === "declared") {
        const release = JSON.parse(readFileSync(join(directory, path), "utf8"));
        release.assets.push({ file: "docs/resources-fixture.png", route: "docs/resources-fixture.png" });
        writeFileSync(join(directory, path), JSON.stringify(release));
      } else {
        writeFileSync(join(directory, path),
          `${readFileSync(join(directory, path), "utf8")}\nconst image = "../../docs/resources-fixture.png";\n`);
      }
      git(directory, "add", path);
      git(directory, "commit", "--quiet", "-m", "Synthetic reviewed runtime asset");
      git(directory, "tag", "-f", "azure-resources-query-v0-1-1-be9551d");
      const image = "canvases/azure-resources-query/docs/resources-fixture.png";
      writeFileSync(join(directory, image), "Changed runtime image\n");
      git(directory, "add", image);
      git(directory, "commit", "--quiet", "-m", "Change imported runtime image");
      assert.throws(() => verifyPlugin(publicManifest.plugins[2], directory),
        /current package bytes differ.*outside mutable documentation/, kind);
    });
  }
});

test("target tags identify independently reviewed source commits", () => {
  assert.doesNotThrow(() => verifyTagSource("azure-sre-agent", "0.2.4",
    "azure-sre-agent-v0-2-4-b6acf8d7"));
  assert.throws(() => verifyTagSource("azure-sre-agent", "0.2.4",
    "azure-sre-agent-v0-2-4-0ba4899a"), /does not identify/);
  assert.doesNotThrow(() => verifyTagSource("canvas-authoring", "0.1.0", tag));
  assert.throws(() => verifyTagSource("canvas-authoring", "0.1.0",
    "canvas-authoring-v0-1-0-deadbee"), /does not identify/);
  assert.throws(() => verifyTagSource("canvas-authoring", "0.1.0",
    "canvas-authoring-v0-1-0-23aa"), /does not identify/);
  assert.throws(() => verifyMarketplace(changed(publicManifest, (m) => {
    m.plugins[3].version = "0.1.1";
  })), /versions must match/);
});

test("three canvas tags share the exact reviewed release; builder must descend from staging main", () => {
  assert.doesNotThrow(() => verifyCombinedReleaseCommits(Array(3).fill(
    "482188d87a3a3baf36ae3726412bc93adb310011")));
  assert.throws(() => verifyCombinedReleaseCommits(["abc", "def", "abc"]), /reviewed public release/);
  assert.throws(() => verifyCombinedReleaseCommits(["abc", "abc"]), /reviewed public release/);
  assert.throws(() => verifyBuilderReleaseCommit("482188d87a3a3baf36ae3726412bc93adb310011"),
    /later product commit/);
  assert.throws(() => verifyBuilderReleaseCommit("3c85649077b4350e4b1c81df3328233d1b45877c"),
    /protected files/);
});

test("synthetic local-only tags qualify merged bytes but cannot override protected files", () => {
  withClone((directory) => {
    git(directory, "checkout", "--quiet", "-b", "synthetic-local-product", candidate);
    withoutBuilderTags(directory);
    git(directory, "tag", tag);
    git(directory, "tag", "canvas-authoring-latest");
    git(directory, "update-ref", "refs/remotes/origin/main",
      "3c85649077b4350e4b1c81df3328233d1b45877c");
    assert.throws(() => verifyMarketplace(publicManifest, { root: directory }),
      /product commit merged into public origin\/main/);
    git(directory, "update-ref", "refs/remotes/origin/main", candidate);
    const results = verifyMarketplace(publicManifest, { root: directory });
    assert.equal(results.length, 4);
    assert.match(results[3], new RegExp(`${tag}$`));
    git(directory, "tag", "-f", "canvas-authoring-latest",
      "3c85649077b4350e4b1c81df3328233d1b45877c");
    assert.throws(() => verifyMarketplace(publicManifest, { root: directory }),
      /latest tag must point/);
    git(directory, "tag", "-f", "canvas-authoring-latest", candidate);
    writeFileSync(join(directory, "plugins/canvas-authoring/plugin.json"), "{}\n");
    git(directory, "add", "plugins/canvas-authoring/plugin.json");
    git(directory, "commit", "--quiet", "-m", "Synthetic drifted product");
    assert.throws(() => verifyMarketplace(publicManifest, { root: directory }),
      /current package bytes differ/);
  });
});

test("new-version candidate qualifies only with approved base source, artifact, catalog and README", () => {
    withApprovedCandidate((directory, base, manifest, pin) => {
      const results = verifyMarketplaceCandidate(manifest, { root: directory, base });
      assert.equal(results.length, 4);
      assert.match(results[0], new RegExp(`candidate ${pin.sourceSha} ${pin.receiptSha256}$`));
      assert.match(results[3], /canvas-authoring@0\.1\.0 canvas-authoring-v0-1-0-23aa6b1/);
      assert.throws(() => verifyMarketplace(manifest, { root: directory }),
        /expected exactly one reviewed immutable release tag/);
      assert.throws(() => verifyMarketplaceCandidate(manifest, { root: directory, base: "0".repeat(40) }),
        /full PR base SHA/);
      assert.doesNotThrow(() => verifyTagSource(pin.name, pin.version,
        `${pin.name}-v0-2-5-aaaaaaa`, pin));
      assert.throws(() => verifyTagSource(pin.name, pin.version,
        `${pin.name}-v0-2-5-deadbee`, pin), /does not identify/);
    });
});

test("new canvas needs a base-approved source, skills, logo and protected receipt", () => {
  withApprovedNewCanvas((directory, base, manifest) => {
    assert.equal(verifyMarketplaceCandidate(manifest, { root: directory, base }).length, 5);
    assert.throws(() => verifyMarketplace(manifest, { root: directory }),
      /expected exactly one reviewed immutable release tag/);
    const unpinned = changed(manifest, (m) => {
      m.plugins[4].name = "azure-unapproved";
      m.plugins[4].source = "canvases/azure-unapproved";
    });
    assert.throws(() => verifyMarketplaceCandidate(unpinned, { root: directory, base }),
      /additions need base pins/);
  });
});

test("approved pins do not block unrelated documentation-only PRs", () => {
  withApprovedCandidate((directory, base) => {
    git(directory, "checkout", "--quiet", "-b", "pinned-docs-only", base);
    const readme = join(directory, "canvases/azure-sre-agent/README.md");
    writeFileSync(readme, `${readFileSync(readme, "utf8")}\nDocumentation clarification.\n`);
    git(directory, "add", readme);
    git(directory, "commit", "--quiet", "-m", "Clarify current-version customer documentation");
    assert.equal(verifyMarketplaceCandidate(publicManifest, { root: directory, base }).length, 4);
  });
});

test("candidate rejects protected tampering even when checksums, receipt and inventory are rewritten", () => {
    withApprovedCandidate((directory, base, manifest) => {
      const path = "canvases/azure-sre-agent";
      const hero = join(directory, path, "extensions/azure-sre-agent/assets/preview.png");
      writeFileSync(hero, "tampered icon\n");
      git(directory, "add", path);
      git(directory, "commit", "--quiet", "-m", "Change protected preview image");
      assert.throws(() => verifyMarketplaceCandidate(manifest, { root: directory, base }),
        /candidate checksums do not match/);
      const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
      const checksumPath = join(directory, path, "checksums.json");
      const checksums = JSON.parse(readFileSync(checksumPath, "utf8"));
      checksums["extensions/azure-sre-agent/assets/preview.png"] = digest(readFileSync(hero));
      writeFileSync(checksumPath, `${JSON.stringify(checksums)}\n`);
      const sumsPath = join(directory, path, "SHA256SUMS");
      let sums = readFileSync(sumsPath, "utf8").replace(
        /^[0-9a-f]{64}(  extensions\/azure-sre-agent\/assets\/preview\.png)$/m,
        `${digest(readFileSync(hero))}$1`,
      ).replace(
        /^[0-9a-f]{64}(  checksums\.json)$/m,
        `${digest(readFileSync(checksumPath))}$1`,
      );
      writeFileSync(sumsPath, sums);
      const inventoryPath = join(directory, path, "inventory.json");
      const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
      inventory.sha256 = digest(Buffer.from(sums));
      inventory.files["extensions/azure-sre-agent/assets/preview.png"] = digest(readFileSync(hero));
      inventory.files["checksums.json"] = digest(readFileSync(checksumPath));
      writeFileSync(inventoryPath, `${JSON.stringify(inventory)}\n`);
      git(directory, "add", path);
      git(directory, "commit", "--quiet", "-m", "Rewrite candidate receipts for tampered image");
      assert.throws(() => verifyMarketplaceCandidate(manifest, { root: directory, base }),
        /receipt, inventory, or approved source SHA differs from the base pin/);
    });
});

test("candidate rejects bogus source pin, stale version, missing artifact and self-approved pins", () => {
    withApprovedCandidate((directory, base, manifest) => {
      const inventoryPath = join(directory, "canvases/azure-sre-agent/inventory.json");
      const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
      inventory.sourceSha = "b".repeat(40);
      writeFileSync(inventoryPath, `${JSON.stringify(inventory)}\n`);
      git(directory, "add", inventoryPath);
      git(directory, "commit", "--quiet", "-m", "Claim another source SHA");
      assert.throws(() => verifyMarketplaceCandidate(manifest, { root: directory, base }),
        /receipt, inventory, or approved source SHA differs/);
    });
    withApprovedCandidate((directory, base, manifest) => {
      const stale = changed(manifest, (m) => { m.plugins[0].version = "0.2.4"; });
      assert.throws(() => verifyMarketplaceCandidate(stale, { root: directory, base }),
        /current package bytes differ/);
      const unexpected = changed(manifest, (m) => {
        m.plugins.push({ name: "azure-cost-health", version: "0.4.4", source: "canvases/azure-cost-health" });
      });
      assert.throws(() => verifyMarketplaceCandidate(unexpected, { root: directory, base }),
        /retain the four reviewed public products/);
      git(directory, "rm", "--quiet", "canvases/azure-sre-agent/inventory.json");
      git(directory, "commit", "--quiet", "-m", "Remove candidate receipt inventory");
      assert.throws(() => verifyMarketplaceCandidate(manifest, { root: directory, base }),
        /missing a release artifact/);
    });
    withApprovedCandidate((directory, base, manifest) => {
      const pinPath = join(directory, ".github/plugin/marketplace-candidate-pins.json");
      const pins = JSON.parse(readFileSync(pinPath, "utf8"));
      pins.products[0].sourceSha = "b".repeat(40);
      writeFileSync(pinPath, `${JSON.stringify(pins)}\n`);
      git(directory, "add", pinPath);
      git(directory, "commit", "--quiet", "-m", "Self-approve different source");
      assert.throws(() => verifyMarketplaceCandidate(manifest, { root: directory, base }),
        /cannot change its own approved base pins/);
    });
});

test("synthetic release refs cannot override historical builder commit or receipt", () => {
  withClone((directory) => {
    git(directory, "checkout", "--quiet", "-b", "synthetic-local-product", candidate);
    writeFileSync(join(directory, "README.md"), "Synthetic protected file change\n");
    git(directory, "add", "README.md");
    git(directory, "commit", "--quiet", "-m", "Synthetic protected file edit");
    assert.throws(() => verifyBuilderReleaseCommit(git(directory, "rev-parse", "HEAD"), directory),
      /protected files/);
  });
  withClone((directory) => {
    git(directory, "checkout", "--quiet", "-b", "synthetic-local-product", candidate);
    withoutBuilderTags(directory);
    writeFileSync(join(directory, "plugins/canvas-authoring/skills/create-canvas-app/SKILL.md"),
      "---\nname: create-canvas-app\n---\nTampered skill bytes\n");
    git(directory, "add", "plugins/canvas-authoring");
    git(directory, "commit", "--quiet", "-m", "Synthetic stale integrity receipt");
    git(directory, "tag", tag);
    git(directory, "tag", "canvas-authoring-latest");
    git(directory, "update-ref", "refs/remotes/origin/main", "HEAD");
    assert.throws(() => verifyPlugin(publicManifest.plugins[3], directory),
      /tagged package bytes differ from SHA256SUMS/);
    assert.throws(() => verifyBuilderReleaseCommit(git(directory, "rev-parse", "HEAD"), directory),
      /reviewed public product merge commit/);
  });
});
