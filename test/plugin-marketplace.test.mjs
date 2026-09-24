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
