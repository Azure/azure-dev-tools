import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  verifyCombinedReleaseCommits,
  verifyMarketplace,
  verifyPlugin,
  verifyTagSource,
} from "../scripts/verify-plugin-marketplace.mjs";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/marketplace.candidate.json", import.meta.url)));

function modified(update) {
  const manifest = structuredClone(fixture);
  update(manifest);
  return manifest;
}

test("accepts three independently pinned package versions with extension and skills", () => {
  const results = verifyMarketplace(fixture);
  assert.equal(results.length, 3);
  assert.match(results[0], /azure-sre-agent@0\.2\.3 af40b92/);
});

test("rejects missing products and duplicate entries", () => {
  assert.throws(() => verifyMarketplace(modified((m) => m.plugins.pop())), /exactly the three/);
  assert.throws(() => verifyMarketplace(modified((m) => {
    m.plugins[1] = structuredClone(m.plugins[0]);
  })), /exactly the three/);
});

test("rejects moving refs and non-public plugin sources", () => {
  assert.throws(() => verifyMarketplace(modified((m) => {
    delete m.plugins[0].source.sha;
    m.plugins[0].source.ref = "main";
  })), /repo-relative path or a full public commit SHA/);
  assert.throws(() => verifyMarketplace(modified((m) => {
    m.plugins[0].source.repo = "example/not-azure-dev-tools";
  })), /repo-relative path or a full public commit SHA/);
});

test("rejects mismatched package version, path, or commit", () => {
  assert.throws(() => verifyMarketplace(modified((m) => {
    m.plugins[0].version = "0.2.4";
  })), /metadata, extension, or skills differ/);
  assert.throws(() => verifyMarketplace(modified((m) => {
    m.plugins[0].source.path = "canvases/azure-functions-hosted-skills";
  })), /repo-relative path or a full public commit SHA/);
  assert.throws(() => verifyMarketplace(modified((m) => {
    m.plugins[0].source.sha = "0".repeat(40);
  })), /azure-sre-agent@0.2.3/);
});

test("repo-relative source follows current bytes only when they match the release tag", () => {
  assert.match(verifyPlugin({
    name: "azure-sre-agent",
    version: "0.2.3",
    source: "canvases/azure-sre-agent",
  }), /azure-sre-agent-v0-2-3-0e5c4772/);
  assert.throws(() => verifyPlugin({
    name: "azure-resources-query",
    version: "0.1.0",
    source: "canvases/azure-resources-query",
  }), /exactly one reviewed immutable release tag/);
  assert.throws(() => verifyPlugin({
    name: "azure-sre-agent",
    version: "0.2.4",
    source: "canvases/azure-sre-agent",
  }), /exactly one reviewed immutable release tag/);
  assert.throws(() => verifyPlugin({
    name: "azure-sre-agent",
    version: "0.2.2",
    source: "canvases/azure-sre-agent",
  }), /current package bytes differ/);
});

test("target tags must identify each independently reviewed source commit", () => {
  assert.doesNotThrow(() => verifyTagSource(
    "azure-sre-agent", "0.2.4", "azure-sre-agent-v0-2-4-0ba4899a",
  ));
  assert.doesNotThrow(() => verifyTagSource(
    "azure-functions-hosted-skills", "0.5.1",
    "azure-functions-hosted-skills-v0-5-1-2bb83548",
  ));
  assert.doesNotThrow(() => verifyTagSource(
    "azure-resources-query", "0.1.1", "azure-resources-query-v0-1-1-be9551d7",
  ));
  assert.throws(() => verifyTagSource(
    "azure-sre-agent", "0.2.4", "azure-sre-agent-v0-2-4-deadbeef",
  ), /does not identify the reviewed source commit/);
  assert.throws(() => verifyTagSource(
    "azure-sre-agent", "0.2.4", "azure-sre-agent-v0-2-4-0ba",
  ), /does not identify the reviewed source commit/);
  assert.throws(() => verifyMarketplace(modified((m) => {
    m.name = "azure-dev-tools";
  })), /versions must match/);
});

test("distinct product tags may share exactly one combined public merge commit", () => {
  assert.doesNotThrow(() => verifyCombinedReleaseCommits(["abc", "abc", "abc"]));
  assert.throws(() => verifyCombinedReleaseCommits(["abc", "def", "abc"]), /same reviewed public merge/);
  assert.throws(() => verifyCombinedReleaseCommits(["abc", "abc"]), /same reviewed public merge/);
});
