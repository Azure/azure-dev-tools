import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  verifyBuilderReleaseCommit,
  verifyCombinedReleaseCommits,
  verifyMarketplace,
  verifyPlugin,
  verifyTagSource,
} from "../scripts/verify-plugin-marketplace.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(new URL("./fixtures/marketplace.candidate.json", import.meta.url)));
const publicManifest = JSON.parse(readFileSync(new URL("../.github/plugin/marketplace.json", import.meta.url)));
const candidate = "f0aeab8cbf7d64d0070045ee6c07dc083db01cd4";
const tag = "canvas-authoring-v0-1-0-23aa6b1";

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
      /exactly three canvas plugins and the skill-only builder/);
    assert.throws(() => verifyMarketplace(changed(manifest, (m) => {
      m.plugins[3] = structuredClone(m.plugins[0]);
    }), { root: directory, fixture: true }), /exactly three canvas plugins and the skill-only builder/);
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
  assert.throws(() => verifyMarketplace(publicManifest), /canvas-authoring@0\.1\.0: expected exactly one reviewed immutable release tag/);
  assert.throws(() => verifyMarketplace(fixture), /expected public name/);
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

test("synthetic local-only tags qualify candidate bytes but cannot override protected files", (context) => {
  try {
    git(root, "cat-file", "-e", `${candidate}:plugins/canvas-authoring/plugin.json`);
  } catch {
    context.skip("Public product candidate commit is not present in this checkout");
    return;
  }
  withClone((directory) => {
    git(directory, "checkout", "--quiet", "-b", "synthetic-local-product", candidate);
    git(directory, "tag", tag);
    git(directory, "tag", "canvas-authoring-latest");
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
    writeFileSync(join(directory, "plugins/canvas-authoring/skills/create-canvas-app/SKILL.md"),
      "---\nname: create-canvas-app\n---\nTampered skill bytes\n");
    git(directory, "add", "plugins/canvas-authoring");
    git(directory, "commit", "--quiet", "-m", "Synthetic stale integrity receipt");
    git(directory, "tag", tag);
    git(directory, "tag", "canvas-authoring-latest");
    assert.throws(() => verifyMarketplace(publicManifest, { root: directory }),
      /tagged package bytes differ from SHA256SUMS/);
  });
});
