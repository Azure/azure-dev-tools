// packages/canvas-toolkit/src/ui/commands-log.mjs
var prefix = "canvas-commands-log";
function createCommandsLog({
  document = globalThis.document,
  mount,
  title = "Command activity",
  emptyText = "No commands run yet.",
  locale
} = {}) {
  if (!document?.createElement) throw new TypeError("A document is required.");
  if (mount !== void 0 && typeof mount?.append !== "function") throw new TypeError("mount must be appendable.");
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== void 0) node.textContent = text;
    return node;
  };
  const root = el("section", `${prefix} canvas-ui`);
  root.setAttribute("aria-label", title);
  const toolbar = el("div", `${prefix}-toolbar`);
  const headingLabel = el("span", `${prefix}-heading-label`, title);
  const count = el("span", `${prefix}-count`);
  count.setAttribute("aria-hidden", "true");
  toolbar.append(headingLabel, count);
  const empty = el("div", `${prefix}-empty`, emptyText);
  const list = el("ol", `${prefix}-list`);
  list.setAttribute("role", "log");
  list.setAttribute("aria-live", "polite");
  root.append(toolbar, empty, list);
  if (mount?.append) mount.append(root);
  const statusLabel = (status) => status === "run" ? "Running" : status === "err" ? "Failed" : "Succeeded";
  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    try {
      return date.toLocaleTimeString(locale);
    } catch {
      return date.toISOString();
    }
  };
  const formatMs = (ms) => {
    if (ms == null) return "";
    return ms >= 1e3 ? `${(ms / 1e3).toFixed(ms >= 1e4 ? 0 : 1)} s` : `${Math.round(ms)} ms`;
  };
  const statusEl = (status) => {
    const node = el("span", `${prefix}-status ${prefix}-status-${status}`);
    const dot = el("span", `${prefix}-dot`);
    dot.setAttribute("aria-hidden", "true");
    node.append(dot, el("span", `${prefix}-status-label`, statusLabel(status)));
    return node;
  };
  const rowFor = (command) => {
    const status = command.status || "ok";
    const row = el("li", `${prefix}-row`);
    row.setAttribute("data-status", status);
    row.setAttribute("data-kind", command.kind || "cmd");
    const head = el("div", `${prefix}-head`);
    head.append(statusEl(status));
    if (command.kind) head.append(el("span", `${prefix}-kind`, command.kind));
    head.append(el("span", `${prefix}-title`, command.title || ""));
    head.append(el("span", `${prefix}-spacer`));
    const time = formatTime(command.ts);
    if (time) head.append(el("time", `${prefix}-time`, time));
    if (command.ms != null) head.append(el("span", `${prefix}-ms`, formatMs(command.ms)));
    row.append(head);
    if (command.cmd) {
      const block = el("div", `${prefix}-cmd`);
      block.append(el("code", `${prefix}-cmd-text`, command.cmd));
      row.append(block);
    }
    if (command.purpose) row.append(el("div", `${prefix}-purpose`, command.purpose));
    if (command.note) row.append(el("div", `${prefix}-note`, command.note));
    return row;
  };
  function render(commands = []) {
    const rows = Array.isArray(commands) ? commands : [];
    list.replaceChildren(...rows.map(rowFor));
    count.textContent = rows.length ? String(rows.length) : "";
    empty.hidden = rows.length > 0;
  }
  render([]);
  return { element: root, render, destroy: () => root.remove() };
}
export {
  createCommandsLog
};
