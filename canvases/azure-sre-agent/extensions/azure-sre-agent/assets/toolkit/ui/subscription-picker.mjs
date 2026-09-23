// packages/canvas-toolkit/src/ui/subscription-picker.mjs
import { createIcon } from "./icons.mjs";
var subscriptionIcon = new URL("../icons/Subscription.svg", import.meta.url);
var instances = /* @__PURE__ */ new WeakMap();
var prefix = "canvas-subscription-picker";
var groupKey = (item) => JSON.stringify([item.tenantId.toLowerCase(), item.cloud ?? ""]);
var countLabel = (count) => `${count} subscription${count === 1 ? "" : "s"}`;
var errorMessage = (error) => error instanceof Error ? error.message : String(error ?? "");
function createSubscriptionPicker({
  document = globalThis.document,
  id,
  trigger,
  mount = document?.body,
  selectionMode = "multiple",
  singleGroup = false,
  onApply,
  onRefresh,
  onCancel,
  onOpenChange
} = {}) {
  if (!document?.createElement || !mount?.append) throw new TypeError("A document and dialog mount are required.");
  if (typeof id !== "string" || !id || /\s/.test(id)) throw new TypeError("A unique, nonempty id without whitespace is required.");
  if (!["multiple", "single"].includes(selectionMode)) throw new TypeError("selectionMode must be multiple or single.");
  if (typeof onApply !== "function") throw new TypeError("onApply is required.");
  if (onRefresh !== void 0 && typeof onRefresh !== "function") throw new TypeError("onRefresh must be a function.");
  if (trigger && (trigger.tagName !== "BUTTON" || trigger.ownerDocument !== document)) {
    throw new TypeError("trigger must be a button in the supplied document.");
  }
  const ids = instances.get(document) ?? /* @__PURE__ */ new Set();
  const baseId = `${prefix}-${id}`;
  if (ids.has(id) || document.getElementById(id) || document.getElementById(baseId)) {
    throw new Error(`Subscription picker id is already in use: ${id}`);
  }
  instances.set(document, ids);
  ids.add(id);
  const ownsTrigger = !trigger;
  trigger ??= document.createElement("button");
  if (ownsTrigger) trigger.setAttribute("data-metric-id", "subscription-picker-open");
  const originalChildren = [...trigger.childNodes];
  const originalAttributes = new Map(
    ["type", "aria-haspopup", "aria-controls", "aria-expanded", "aria-label", "title", "disabled"].map((name) => [name, trigger.getAttribute(name)])
  );
  const hadTriggerClass = trigger.classList.contains(`${prefix}-trigger`);
  const listeners = [];
  const itemIds = /* @__PURE__ */ new Map();
  const groupIds = /* @__PURE__ */ new Map();
  let subscriptions = [];
  let subscriptionsByKey = /* @__PURE__ */ new Map();
  let applied = /* @__PURE__ */ new Set();
  let draft = /* @__PURE__ */ new Set();
  let loading = false;
  let externalError = "";
  let applyError = "";
  let refreshError = "";
  let refreshing = false;
  let refreshDisabledReason = "";
  let busy = false;
  let opened = false;
  let destroyed = false;
  let operation = 0;
  let confirmDefault = false;
  let defaultStep = false;
  let returnFocus;
  let pointerStartedOutside = false;
  let rows = [];
  function element(tag, suffix, text) {
    const node = document.createElement(tag);
    node.className = `${prefix}-${suffix}`;
    if (text !== void 0) node.textContent = text;
    return node;
  }
  function identified(tag, suffix, text) {
    const node = element(tag, suffix, text);
    node.id = `${baseId}-${suffix}`;
    return node;
  }
  function button(suffix, text, style = "secondary") {
    const node = identified("button", suffix, text);
    node.setAttribute("data-metric-id", `subscription-picker-${suffix}`);
    node.classList.add(`${prefix}-button`, `${prefix}-${style}`);
    node.type = "button";
    return node;
  }
  function icon(suffix, size) {
    const image = element("img", suffix);
    image.src = subscriptionIcon.href;
    image.width = size;
    image.height = size;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    return image;
  }
  function glyph(paths) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [name, value] of Object.entries({
      viewBox: "0 0 16 16",
      width: "16",
      height: "16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "aria-hidden": "true",
      focusable: "false",
      class: `${prefix}-glyph`
    })) svg.setAttribute(name, value);
    for (const d of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }
  function listen(node, type, handler) {
    node.addEventListener(type, handler);
    listeners.push(() => node.removeEventListener(type, handler));
  }
  const dialog = document.createElement("dialog");
  dialog.className = prefix;
  dialog.id = id;
  dialog.setAttribute("aria-modal", "true");
  const header = element("header", "header");
  const back = button("back", void 0, "icon-button");
  back.setAttribute("aria-label", "Back to default subscription");
  back.append(createIcon("arrow-left", document));
  const heading = element("div", "heading");
  const title = identified("h2", "title");
  const description = identified("p", "description");
  heading.append(title, description);
  dialog.setAttribute("aria-labelledby", title.id);
  dialog.setAttribute("aria-describedby", description.id);
  const dismiss = button("close", void 0, "icon-button");
  dismiss.setAttribute("aria-label", "Close subscription picker");
  dismiss.append(glyph(["m4 4 8 8M12 4l-8 8"]));
  const refresh = button("refresh", void 0, "icon-button");
  refresh.title = "Refresh subscriptions";
  refresh.setAttribute("aria-label", "Refresh subscriptions");
  refresh.hidden = !onRefresh;
  refresh.append(createIcon("refresh", document));
  header.append(back, heading, refresh, dismiss);
  const defaultCard = identified("div", "default");
  const defaultCopy = element("div", "default-copy");
  const defaultName = element("span", "default-name");
  const defaultId = element("span", "subscription-id");
  defaultCopy.append(defaultName, defaultId);
  defaultCard.append(icon("default-icon", 28), defaultCopy);
  const selection = identified("div", "selection");
  const searchBox = element("div", "search-box");
  const search = identified("input", "search");
  search.setAttribute("data-metric-id", "subscription-picker-search");
  search.type = "search";
  search.placeholder = "Search by name or ID...";
  search.autocomplete = "off";
  search.spellcheck = false;
  const searchLabel = element("label", "sr-only", "Search subscriptions or tenants by name or ID");
  searchLabel.htmlFor = search.id;
  searchBox.append(glyph(["M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0", "m10.5 10.5 3 3"]), searchLabel, search);
  const toolbar = element("div", "toolbar");
  const matches = identified("span", "matches");
  matches.setAttribute("role", "status");
  const bulk = button("bulk", "Select all", "text-button");
  toolbar.append(matches, bulk);
  const groupHelp = identified("p", "group-help", "Select subscriptions from one tenant and cloud. Clear selection to switch.");
  const list = identified("div", "list");
  list.setAttribute("role", selectionMode === "single" ? "radiogroup" : "group");
  list.setAttribute("aria-label", "Subscriptions");
  if (singleGroup) list.setAttribute("aria-describedby", groupHelp.id);
  groupHelp.hidden = !singleGroup;
  selection.append(searchBox, toolbar, groupHelp, list);
  const error = identified("div", "error");
  error.setAttribute("role", "alert");
  const defaultActions = element("footer", "footer");
  defaultActions.classList.add(`${prefix}-default-actions`);
  const choose = button("choose", "Choose subscriptions");
  const proceed = button("continue", "Continue", "primary");
  defaultActions.append(choose, proceed);
  const actions = element("footer", "footer");
  const selectionCount = identified("span", "count");
  selectionCount.setAttribute("role", "status");
  const cancel = button("cancel", "Cancel");
  const apply = button("apply", "Apply", "primary");
  actions.append(selectionCount, cancel, apply);
  dialog.append(header, defaultCard, selection, error, defaultActions, actions);
  mount.append(dialog);
  trigger.classList.add(`${prefix}-trigger`);
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", dialog.id);
  trigger.setAttribute("aria-expanded", "false");
  const pill = element("span", "pill");
  const summary = element("span", "summary");
  pill.append(icon("pill-icon", 14), summary);
  const change = element("span", "change");
  change.append(element("span", "change-label", "Change"), createIcon("chevron-down", document));
  trigger.replaceChildren(pill, change);
  function defaultSubscription() {
    const candidates = subscriptions.filter((item) => item.isDefault && !item.disabled);
    return candidates.length === 1 ? candidates[0] : void 0;
  }
  function matching() {
    const query = search.value.trim().toLowerCase();
    return subscriptions.filter((item) => [item.name, item.id, item.tenantName, item.tenantId, item.cloud].join(" ").toLowerCase().includes(query));
  }
  function validation(keys) {
    const candidates = subscriptionsByKey;
    if (!keys.size) return "Select at least one subscription.";
    if ([...keys].some((key) => !candidates.has(key))) return "Some selected subscriptions are no longer available. Clear selection and choose again.";
    const items = [...keys].map((key) => candidates.get(key));
    if (items.some((item) => item.disabled)) return "Some selected subscriptions are unavailable. Clear selection and choose again.";
    if (selectionMode === "single" && keys.size !== 1) return "Select only one subscription.";
    if (singleGroup && new Set(items.map(groupKey)).size > 1) return "Select subscriptions from one tenant and cloud. Clear selection to switch.";
    return "";
  }
  function blockedByGroup(item) {
    if (!singleGroup || draft.has(item.key)) return false;
    const candidates = subscriptionsByKey;
    return [...draft].some((key) => !candidates.has(key) || groupKey(candidates.get(key)) !== groupKey(item));
  }
  function bulkClears() {
    const eligible = matching().filter((item) => !item.disabled);
    return draft.size > 0 && (singleGroup || selectionMode === "single" || !!validation(draft) || eligible.length > 0 && eligible.every((item) => draft.has(item.key)));
  }
  function renderSummary() {
    const candidates = subscriptionsByKey;
    const names = [...applied].map((key) => candidates.get(key)?.name ?? key);
    summary.textContent = names.length === 1 ? names[0] : names.length ? countLabel(names.length) : "Choose subscriptions";
    const label = names.length ? `Change subscriptions. ${countLabel(names.length)} selected: ${names.join(", ")}` : "Choose subscriptions";
    trigger.title = label;
    trigger.setAttribute("aria-label", label);
  }
  function updateControls() {
    const locked = busy || loading || refreshing;
    const invalid = validation(draft);
    const candidate = defaultSubscription();
    dialog.setAttribute("aria-busy", String(locked));
    selectionCount.textContent = `${draft.size} selected`;
    apply.disabled = locked || !!invalid;
    apply.textContent = busy ? "Applying..." : "Apply";
    proceed.disabled = locked || !candidate;
    proceed.textContent = busy ? "Continuing..." : "Continue";
    for (const control of [cancel, dismiss, back, choose]) control.disabled = busy || refreshing;
    refresh.disabled = locked || !!refreshDisabledReason;
    refresh.title = refreshDisabledReason || (refreshing ? "Refreshing subscriptions..." : "Refresh subscriptions");
    search.disabled = locked;
    const eligible = matching().filter((item) => !item.disabled);
    const clear = bulkClears();
    bulk.textContent = clear ? "Clear selection" : "Select all";
    const clearAll = singleGroup || selectionMode === "single" || !!invalid;
    bulk.setAttribute("aria-label", clear ? clearAll ? "Clear selection" : "Clear matching subscriptions" : "Select all matching subscriptions");
    bulk.hidden = selectionMode === "single" && !draft.size;
    bulk.disabled = locked || !clear && (!eligible.length || singleGroup && new Set(eligible.map(groupKey)).size > 1);
    matches.textContent = loading || refreshing ? "Loading subscriptions..." : countLabel(matching().length);
    for (const { input, item, row, reason } of rows) {
      const blocked = blockedByGroup(item);
      input.checked = draft.has(item.key);
      input.disabled = locked || !!item.disabled || blocked;
      row.classList.toggle(`${prefix}-disabled`, !!item.disabled || blocked);
      reason.textContent = item.disabled ? item.disabledReason || "Unavailable" : blocked ? "Clear selection to switch tenant or cloud." : "";
      reason.hidden = !reason.textContent;
    }
    const message = refreshError || externalError || applyError || (!defaultStep && draft.size ? invalid : "");
    error.textContent = message;
    error.hidden = !message;
    renderSummary();
  }
  function stableId(map, key, kind) {
    if (!map.has(key)) map.set(key, `${baseId}-${kind}-${map.size + 1}`);
    return map.get(key);
  }
  function subscriptionRow(item) {
    const row = element("label", "option");
    const input = element("input", "input");
    input.setAttribute("data-metric-id", "subscription-picker-item");
    const rowId = stableId(itemIds, item.key, "item");
    input.id = rowId;
    input.type = selectionMode === "single" ? "radio" : "checkbox";
    input.name = `${baseId}-subscription`;
    input.value = item.key;
    const copy = element("span", "copy");
    const name = element("span", "name", item.name);
    name.id = `${rowId}-name`;
    name.title = item.name;
    const subscriptionId = element("span", "subscription-id", item.id);
    subscriptionId.id = `${rowId}-id`;
    subscriptionId.title = item.id;
    const reason = element("span", "reason");
    reason.id = `${rowId}-reason`;
    input.setAttribute("aria-labelledby", name.id);
    input.setAttribute("aria-describedby", `${subscriptionId.id} ${reason.id}`);
    copy.append(name, subscriptionId, reason);
    row.append(input, copy);
    rows.push({ row, input, item, reason });
    return row;
  }
  function renderList() {
    const focusKey = rows.find(({ input }) => input === document.activeElement)?.item.key;
    const scrollTop = list.scrollTop;
    const groups = /* @__PURE__ */ new Map();
    for (const item of matching()) {
      const key = groupKey(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    rows = [];
    const nodes = [...groups].map(([key, items]) => {
      const section = element("section", "group");
      section.setAttribute("role", "group");
      const heading2 = element("div", "tenant-heading");
      const item = items[0];
      const label = `${item.tenantName || item.tenantId}${item.cloud ? ` \xB7 ${item.cloud}` : ""}`;
      const name = element("h3", "tenant-name", label);
      name.title = `${label}
${item.tenantId}`;
      name.id = stableId(groupIds, key, "tenant");
      section.setAttribute("aria-labelledby", name.id);
      const count = element("span", "tenant-count", String(items.length));
      count.setAttribute("aria-label", countLabel(items.length));
      heading2.append(name, count);
      section.append(heading2, ...items.map(subscriptionRow));
      return section;
    });
    if (!nodes.length) {
      const empty = element("div", "empty");
      empty.append(
        element("h3", "empty-title", loading ? "Loading subscriptions..." : "No subscriptions found"),
        element("p", "empty-help", loading ? "Please wait." : search.value ? "Try a different subscription or tenant name or ID." : "No subscriptions are available.")
      );
      nodes.push(empty);
    }
    list.replaceChildren(...nodes);
    list.scrollTop = scrollTop;
    updateControls();
    if (focusKey !== void 0 && opened) {
      const input = rows.find((row) => row.item.key === focusKey)?.input;
      if (input && !input.disabled) input.focus({ preventScroll: true });
      else if (!search.disabled) search.focus({ preventScroll: true });
    }
  }
  function showStep(useDefault, focus = true) {
    const candidate = defaultSubscription();
    defaultStep = confirmDefault && useDefault && !!candidate && !loading;
    defaultCard.hidden = !defaultStep;
    defaultActions.hidden = !defaultStep;
    selection.hidden = defaultStep;
    actions.hidden = defaultStep;
    back.hidden = !confirmDefault || defaultStep || !candidate || loading;
    title.textContent = defaultStep ? "Use your default subscription?" : "Select subscriptions";
    description.textContent = defaultStep ? "Continue with this subscription, or choose others." : selectionMode === "single" ? "Choose one subscription." : "Choose one or more subscriptions.";
    defaultName.textContent = candidate?.name ?? "";
    defaultName.title = candidate?.name ?? "";
    defaultId.textContent = candidate?.id ?? "";
    defaultId.title = candidate?.id ?? "";
    updateControls();
    if (focus) (defaultStep ? proceed : search.disabled ? dismiss : search).focus();
  }
  function finish(cancelled) {
    if (!opened) return;
    opened = false;
    operation++;
    busy = false;
    pointerStartedOutside = false;
    draft = new Set(applied);
    if (dialog.open) dialog.close();
    trigger.setAttribute("aria-expanded", "false");
    renderSummary();
    const target = returnFocus?.isConnected && !returnFocus.disabled && returnFocus !== document.body && returnFocus !== document.documentElement ? returnFocus : trigger;
    if (target.isConnected) target.focus();
    onOpenChange?.(false);
    if (cancelled) onCancel?.();
  }
  function close({ cancelled = false } = {}) {
    if (!destroyed && !busy && !refreshing) finish(cancelled);
  }
  function open({ confirmDefault: requestedDefault = false } = {}) {
    if (destroyed || opened) return;
    draft = new Set(applied);
    confirmDefault = requestedDefault;
    applyError = "";
    refreshError = "";
    search.value = "";
    returnFocus = document.activeElement;
    renderList();
    showStep(true, false);
    dialog.showModal();
    opened = true;
    trigger.setAttribute("aria-expanded", "true");
    list.scrollTop = 0;
    (defaultStep ? proceed : search.disabled ? dismiss : search).focus();
    onOpenChange?.(true);
  }
  async function applySelection(keys) {
    if (destroyed || !opened || busy || loading || refreshing) return;
    const invalid = validation(keys);
    if (invalid) {
      applyError = invalid;
      updateControls();
      return;
    }
    const currentOperation = ++operation;
    const candidates = subscriptionsByKey;
    const items = [...keys].map((key) => ({ ...candidates.get(key) }));
    busy = true;
    applyError = "";
    updateControls();
    try {
      await onApply(items);
      if (destroyed || currentOperation !== operation) return;
      const stale = validation(keys);
      if (stale) throw new Error(stale);
      applied = new Set(keys);
      finish(false);
    } catch (failure) {
      if (destroyed || currentOperation !== operation) return;
      applyError = errorMessage(failure) || "Could not apply subscriptions. Try again.";
      busy = false;
      updateControls();
      const retry = defaultStep ? proceed : apply;
      (retry.disabled ? dismiss : retry).focus();
    }
  }
  async function refreshSubscriptions() {
    if (destroyed || !opened || !onRefresh || busy || loading || refreshing || refreshDisabledReason) return;
    const currentOperation = ++operation;
    refreshing = true;
    refreshError = "";
    applyError = "";
    updateControls();
    try {
      await onRefresh();
    } catch (failure) {
      if (!destroyed && currentOperation === operation) refreshError = errorMessage(failure) || "Could not refresh subscriptions. Try again.";
    } finally {
      refreshing = false;
      if (!destroyed) updateControls();
    }
  }
  function setState(state = {}) {
    if (destroyed) return;
    if (Object.hasOwn(state, "subscriptions")) {
      if (!Array.isArray(state.subscriptions)) throw new TypeError("subscriptions must be an array.");
      const keys = /* @__PURE__ */ new Set();
      for (const item of state.subscriptions) {
        if (!item || ["key", "id", "name", "tenantId"].some((field) => typeof item[field] !== "string") || !item.key || keys.has(item.key)) throw new TypeError("Subscriptions require unique string keys and string id, name, tenantId fields.");
        if (item.cloud !== void 0 && typeof item.cloud !== "string") throw new TypeError("cloud must be a string.");
        keys.add(item.key);
      }
    }
    if (Object.hasOwn(state, "selectedKeys")) {
      if (!Array.isArray(state.selectedKeys) && !(state.selectedKeys instanceof Set) || [...state.selectedKeys].some((key) => typeof key !== "string")) {
        throw new TypeError("selectedKeys must be an array or Set of opaque string keys.");
      }
    }
    if (Object.hasOwn(state, "subscriptions")) {
      subscriptions = state.subscriptions.map((item) => ({ ...item }));
      subscriptionsByKey = new Map(subscriptions.map((item) => [item.key, item]));
    }
    if (Object.hasOwn(state, "selectedKeys")) applied = new Set(state.selectedKeys);
    if (Object.hasOwn(state, "loading")) loading = !!state.loading;
    if (Object.hasOwn(state, "error")) externalError = errorMessage(state.error);
    if (Object.hasOwn(state, "refreshDisabledReason")) refreshDisabledReason = errorMessage(state.refreshDisabledReason);
    if (!opened) draft = new Set(applied);
    const focusDefault = opened && defaultStep && (!defaultSubscription() || loading);
    renderList();
    showStep(defaultStep, focusDefault);
  }
  listen(trigger, "click", () => open());
  const cancelSelection = () => close({ cancelled: true });
  listen(dismiss, "click", cancelSelection);
  listen(cancel, "click", cancelSelection);
  listen(choose, "click", () => {
    if (!busy && !refreshing) showStep(false);
  });
  listen(back, "click", () => {
    if (!busy && !refreshing) showStep(true);
  });
  listen(refresh, "click", refreshSubscriptions);
  listen(apply, "click", () => applySelection(new Set(draft)));
  listen(proceed, "click", () => {
    const candidate = defaultSubscription();
    if (candidate) applySelection(/* @__PURE__ */ new Set([candidate.key]));
  });
  listen(dialog, "cancel", (event) => {
    event.preventDefault();
    cancelSelection();
  });
  listen(dialog, "close", () => {
    if (!dialog.open) finish(false);
  });
  const outside = (event) => {
    if (event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  listen(dialog, "pointerdown", (event) => {
    pointerStartedOutside = outside(event);
  });
  listen(dialog, "pointercancel", () => {
    pointerStartedOutside = false;
  });
  listen(dialog, "click", (event) => {
    const dismissOutside = pointerStartedOutside && outside(event);
    pointerStartedOutside = false;
    if (dismissOutside) cancelSelection();
  });
  listen(search, "input", () => {
    if (busy || loading || refreshing) return;
    list.scrollTop = 0;
    renderList();
  });
  listen(search, "keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      rows.find(({ input }) => !input.disabled)?.input.focus();
    }
  });
  listen(list, "keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const inputs = rows.map((row) => row.input).filter((input) => !input.disabled);
    const index = inputs.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    if (index === 0 && event.key === "ArrowUp") search.focus();
    else {
      const next = inputs[Math.min(inputs.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))];
      next.focus();
      if (selectionMode === "single") next.click();
    }
  });
  listen(list, "change", (event) => {
    const row = rows.find(({ input: input2 }) => input2 === event.target);
    if (!row) return;
    const { input, item } = row;
    if (busy || loading || refreshing || item.disabled || blockedByGroup(item)) {
      updateControls();
      return;
    }
    if (input.checked) {
      if (selectionMode === "single") draft.clear();
      draft.add(item.key);
    } else draft.delete(item.key);
    applyError = "";
    updateControls();
  });
  listen(bulk, "click", () => {
    if (busy || loading || refreshing) return;
    if (bulkClears()) {
      if (singleGroup || selectionMode === "single" || validation(draft)) draft.clear();
      else for (const item of matching()) if (!item.disabled) draft.delete(item.key);
    } else {
      const eligible = matching().filter((item) => !item.disabled);
      if (selectionMode === "single" || singleGroup && new Set(eligible.map(groupKey)).size > 1) return;
      for (const item of eligible) draft.add(item.key);
    }
    applyError = "";
    updateControls();
  });
  renderList();
  showStep(false, false);
  return {
    trigger,
    dialog,
    setState,
    open,
    close,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      operation++;
      for (const dispose of listeners) dispose();
      finish(false);
      dialog.remove();
      if (ownsTrigger) trigger.remove();
      else {
        trigger.replaceChildren(...originalChildren);
        if (!hadTriggerClass) trigger.classList.remove(`${prefix}-trigger`);
        for (const [name, value] of originalAttributes) {
          if (value === null) trigger.removeAttribute(name);
          else trigger.setAttribute(name, value);
        }
      }
      ids.delete(id);
      itemIds.clear();
      groupIds.clear();
    },
    get isOpen() {
      return opened;
    }
  };
}
export {
  createSubscriptionPicker
};
