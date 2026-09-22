// packages/canvas-toolkit/src/ui/icons.mjs
var paths = {
  "arrow-left": ["M19 12H5m6-6-6 6 6 6"],
  "arrow-right": ["M5 12h14m-6-6 6 6-6 6"],
  "chevron-down": ["m6 9 6 6 6-6"],
  refresh: ["M20 7v5h-5", "M19.5 12a7.5 7.5 0 1 0-2 5.5", "m20 12-3-3"],
  copy: ["M9 9h11v11H9z", "M15 5V3H3v12h2"],
  "external-link": ["M14 3h7v7m0-7L10 14", "M10 5H4v15h15v-6"],
  resources: ["m12 3 9 5-9 5-9-5 9-5Z", "m3 12 9 5 9-5", "m3 16 9 5 9-5"]
};
function createIcon(name, ownerDocument = document) {
  if (!Object.hasOwn(paths, name)) throw new Error(`Unknown canvas icon: ${name}`);
  const svg = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    class: "canvas-icon",
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.75",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false"
  })) svg.setAttribute(key, value);
  for (const d of paths[name]) {
    const path = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}
function hydrateIcons(root = document) {
  for (const node of root.querySelectorAll("[data-canvas-icon]")) {
    node.replaceChildren(createIcon(node.dataset.canvasIcon, node.ownerDocument));
  }
}
export {
  createIcon,
  hydrateIcons
};
