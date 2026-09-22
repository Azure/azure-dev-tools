import { createRequire as __canvasCreateRequire } from "node:module";
const require = __canvasCreateRequire(import.meta.url);

// canvases/azure-resources-query/skills/azure-resources-query/resolve-canvas-launch.mjs
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
function record(value) {
  return value !== null && typeof value === "object";
}
function declaration(value) {
  return record(value) && "canvasId" in value && typeof value.canvasId === "string" && (!("extensionId" in value) || typeof value.extensionId === "string");
}
function panel(value) {
  return declaration(value) && "instanceId" in value && typeof value.instanceId === "string";
}
function resolveCanvasLaunch(input) {
  if (!record(input) || !("available" in input) || !Array.isArray(input.available) || !input.available.every(declaration) || !("openPanels" in input) || !Array.isArray(input.openPanels) || !input.openPanels.every(panel)) {
    throw new Error("Supply actual host declarations and openPanels; do not assume an empty panel list during a provider switch.");
  }
  const { available, openPanels } = input;
  const extensionId = "extensionId" in input ? input.extensionId : void 0;
  const instanceId = "instanceId" in input ? input.instanceId : void 0;
  if (extensionId !== void 0 && (typeof extensionId !== "string" || !extensionId) || instanceId !== void 0 && (typeof instanceId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(instanceId))) {
    throw new Error("Use a host-declared extensionId and a valid panel instanceId.");
  }
  const canvasId = "azure-resources-query";
  if (!available.some((entry) => entry.canvasId === canvasId)) {
    throw new Error("No canonical Azure Resources Query canvas is registered. Recover registration; do not fall back to a legacy listing canvas.");
  }
  if (!extensionId && available.some((entry) => ["azure-resource-browser", "azure-resource-query"].includes(entry.canvasId))) {
    throw new Error("Legacy and canonical providers are available. Confirm the intended host-declared canonical extensionId; preserve saved views and do not uninstall automatically.");
  }
  const providers = available.filter((entry) => entry.canvasId === canvasId && (!extensionId || entry.extensionId === extensionId));
  if (providers.length !== 1) throw new Error("Select one host-declared extensionId; do not guess a provider ID.");
  const provider = providers[0];
  const matching = openPanels.filter((entry) => entry.canvasId === canvasId && entry.extensionId === provider.extensionId);
  if (!instanceId && matching.length > 1) throw new Error("Multiple matching panels are open; select the intended instanceId.");
  const selected = instanceId || matching[0]?.instanceId || "resources-main";
  const occupied = openPanels.find((entry) => entry.instanceId === selected);
  if (occupied && (occupied.canvasId !== canvasId || occupied.extensionId !== provider.extensionId)) {
    throw new Error("Close the old panel or choose a fresh unoccupied instanceId before switching providers. Reopening would focus the old provider, not migrate saved state.");
  }
  return { canvasId, instanceId: selected, input: { viewId: "current" }, ...provider.extensionId ? { extensionId: provider.extensionId } : {} };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error("Pass JSON containing available declarations and openPanels.");
  console.log(JSON.stringify(resolveCanvasLaunch(JSON.parse(process.argv[2]))));
}
export {
  resolveCanvasLaunch
};
