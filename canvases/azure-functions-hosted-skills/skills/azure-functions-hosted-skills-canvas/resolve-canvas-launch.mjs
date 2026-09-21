import { createRequire as __canvasCreateRequire } from "node:module";
const require = __canvasCreateRequire(import.meta.url);

// canvases/azure-functions-hosted-skills/canvas-identity.mjs
var COMPONENT_ID = "azure-functions-hosted-skills";
var LEGACY_PREVIEW_PLUGIN_IDS = Object.freeze([
  "azure-functions-hosted-skills-preview",
  "azure-functions-hosted-skills-preview-12"
]);

// canvases/azure-functions-hosted-skills/launch-route.mjs
function resolveStudioLaunch({ available, openPanels = [], instanceId, extensionId }) {
  if (!Array.isArray(available) || !Array.isArray(openPanels)) throw new Error("Supply the host's available canvas declarations and open-panel context.");
  const canvasId = COMPONENT_ID;
  if (!available.some((entry) => entry.canvasId === canvasId)) throw new Error("No canonical Hosted Skills canvas is available. Install or recover azure-functions-hosted-skills; legacy folder installs are no longer supported.");
  const providers = available.filter((entry) => entry.canvasId === canvasId && (!extensionId || entry.extensionId === extensionId));
  if (providers.length !== 1) throw new Error("Select one host-declared extensionId for the chosen canvas; do not invent a provider.");
  const provider = providers[0];
  const matching = openPanels.filter((panel) => panel.canvasId === canvasId && panel.extensionId === provider.extensionId);
  if (!instanceId && matching.length > 1) throw new Error("Multiple matching panels are open; select the intended instanceId.");
  const selectedInstance = instanceId || matching[0]?.instanceId || COMPONENT_ID;
  const occupied = openPanels.find((panel) => panel.instanceId === selectedInstance);
  if (occupied && (occupied.canvasId !== canvasId || occupied.extensionId !== provider.extensionId)) {
    throw new Error("Close the old panel or start a fresh chat before switching its canvas type/provider. Reopening this instanceId would focus the old provider, not migrate it.");
  }
  return { canvasId, instanceId: selectedInstance, ...provider.extensionId ? { extensionId: provider.extensionId } : {} };
}

// canvases/azure-functions-hosted-skills/resolve-canvas-launch.mjs
var input = process.argv[2];
if (!input) throw new Error("Pass JSON containing available canvases, openPanels, and legacyOnly when appropriate.");
console.log(JSON.stringify(resolveStudioLaunch(JSON.parse(input))));
