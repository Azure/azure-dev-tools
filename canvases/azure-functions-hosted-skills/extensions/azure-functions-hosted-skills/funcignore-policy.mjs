import { createRequire as __canvasCreateRequire } from "node:module";
const require = __canvasCreateRequire(import.meta.url);

// canvases/azure-functions-hosted-skills/src/funcignore-policy.mjs
import { constants } from "node:fs";
import { copyFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
var REQUIRED_EXCLUSIONS = [
  ".git*",
  ".vscode",
  ".azure",
  "__azurite_db*__.json",
  "__blobstorage__",
  "__queuestorage__",
  "local.settings.json",
  ".venv",
  "__pycache__",
  "*.pyc",
  "*.pyo",
  ".python_packages",
  ".env"
];
async function assertFuncignore(file) {
  let content;
  try {
    content = await readFile(file, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    throw new Error(`Deployment blocked: ${file} is missing. Restore the required .funcignore exclusions before deploying.`);
  }
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  if (lines.some((line) => line.startsWith("!"))) {
    throw new Error(`Deployment blocked: ${file} contains re-inclusion rules that may override required .funcignore exclusions.`);
  }
  const rules = new Set(lines);
  const missing = REQUIRED_EXCLUSIONS.filter((rule) => !rules.has(rule));
  if (missing.length) {
    throw new Error(`Deployment blocked: ${file} is missing required .funcignore exclusions: ${missing.join(", ")}. Restore them before deploying.`);
  }
  return content;
}
async function materializeBundledFuncignore(templateDirectory, destination) {
  const companion = path.join(path.dirname(templateDirectory), "hosted-skill-funcignore.txt");
  const target = path.join(destination, "src", ".funcignore");
  await assertFuncignore(companion);
  try {
    await copyFile(companion, target, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  await assertFuncignore(target);
}
async function assertSafeDeploymentFuncignore(directory) {
  const nested = path.join(directory, "src", "host.json");
  let hasNestedHost;
  try {
    await stat(nested);
    hasNestedHost = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    hasNestedHost = false;
  }
  return assertFuncignore(path.join(directory, hasNestedHost ? "src" : "", ".funcignore"));
}
export {
  assertSafeDeploymentFuncignore,
  materializeBundledFuncignore
};
