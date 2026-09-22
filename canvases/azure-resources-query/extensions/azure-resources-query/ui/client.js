// canvases/azure-resources-query/src/ui/client.js
import { createIcon, hydrateIcons } from "./canvas-ui/icons.mjs";
import { createAzureSubscriptionPicker } from "./canvas-ui/azure-subscription-picker.mjs";
import { formatAzureLocation } from "./canvas-ui/locations.mjs";
(() => {
  "use strict";
  hydrateIcons(document);
  const $ = (id) => document.getElementById(id);
  const queryPresets = {
    all: "Resources\n| project id, name, type, kind, resourceGroup, subscriptionId, location, tags\n| order by name asc, id asc",
    functions: "Resources\n| where type =~ 'microsoft.web/sites'\n| where kind has 'functionapp'\n| project id, name, type, kind, resourceGroup, subscriptionId, location, tags\n| order by name asc, id asc",
    storage: "Resources\n| where type =~ 'microsoft.storage/storageaccounts'\n| project id, name, type, kind, resourceGroup, subscriptionId, location, tags\n| order by name asc, id asc"
  };
  const portalHosts = /* @__PURE__ */ new Set(["portal.azure.com", "portal.azure.us", "portal.azure.cn"]);
  const lower = (value) => String(value ?? "").toLowerCase();
  const text = (value) => value === null || value === void 0 || value === "" ? "Not available" : String(value);
  let model = null;
  let mutationQueue = Promise.resolve();
  let stateRequest = null;
  let stateRequestedAgain = false;
  let queryDraft = null;
  let draftScope = null;
  let draftDirty = false;
  let draftVersion = 0;
  let draftBaseKey = "";
  let queryRunning = false;
  let runAfterScopeApply = false;
  let desiredSelection = null;
  let selectionVersion = 0;
  let listSignature = "";
  let detailsSignature = "";
  let activeScopeRequest = null;
  let scopeSubmitting = false;
  let pickerRendering = false;
  let dismissedScopeRequestId = null;
  let scopeResponseError = null;
  let optimisticQuery = null;
  let ignoredQueryOperationId = null;
  let scrollTop = 0;
  let scrollSaveTimer;
  let toastTimer;
  let closed = false;
  let actionCount = 0;
  let authPending = false;
  let restoringScroll = false;
  const scopePicker = createAzureSubscriptionPicker({
    id: "scope-picker",
    trigger: $("scope-toggle"),
    statusMount: $("scope-status"),
    transport: () => request("./api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }),
    onApply: applyScope,
    onCancel: cancelScopeRequest,
    onOpenChange: pickerOpenChanged
  });
  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== void 0) node.textContent = String(value);
    return node;
  }
  function button(label, className, onClick, title) {
    const node = element("button", className, label);
    node.type = "button";
    if (title) {
      node.title = title;
      node.setAttribute("aria-label", title);
    }
    node.addEventListener("click", onClick);
    return node;
  }
  function showError(error, prefix = "") {
    $("operation-error-text").textContent = `${prefix}${error?.message || String(error)}`;
    $("operation-error").hidden = false;
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").hidden = false;
    toastTimer = setTimeout(() => {
      $("toast").hidden = true;
    }, 3500);
  }
  async function copy(value, label) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable. Select and copy the text manually.");
      await navigator.clipboard.writeText(String(value ?? ""));
      toast(`${label} copied`);
    } catch (error) {
      showError(error, `Could not copy ${label.toLowerCase()}: `);
    }
  }
  async function request(url, options) {
    const response = await fetch(url, { cache: "no-store", ...options });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`The browser server returned an unreadable response (${response.status}).`);
    }
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `Request failed (${response.status}).`), { code: payload?.error?.code });
    return payload;
  }
  function isModel(value) {
    return value && typeof value.viewId === "string" && Number.isFinite(value.revision) && Array.isArray(value.rows);
  }
  function acceptModel(next) {
    if (!isModel(next)) throw new Error("The browser server returned an invalid state.");
    if (model && next.viewId === model.viewId && next.revision < model.revision) return;
    const changedView = !model || next.viewId !== model.viewId;
    const previousFocus = model?.focusedId;
    model = next;
    if (optimisticQuery && (next.queryOperation?.id === optimisticQuery.id && !optimisticQuery.retry || optimisticQuery.retry && next.queryOperation && next.queryOperation.id !== optimisticQuery.id)) optimisticQuery = null;
    syncQueryDraft();
    if (changedView) {
      try {
        scrollTop = Number(sessionStorage.getItem(`azure-resources:scroll:${model.viewId}`)) || 0;
      } catch {
        scrollTop = 0;
      }
    }
    render();
    if (previousFocus !== model.focusedId && model.focusedId) {
      $("detail-scroll").scrollTop = 0;
      detailsSignature = "";
      renderDetails();
      requestAnimationFrame(() => $("detail-name").focus({ preventScroll: true }));
    }
  }
  function fetchState() {
    if (closed) return Promise.resolve();
    if (stateRequest) {
      stateRequestedAgain = true;
      return stateRequest;
    }
    stateRequest = request("./api/state").then(acceptModel).catch((error) => {
      showError(error, "Could not update the view: ");
      if (!model) renderInitialFailure();
    }).finally(() => {
      stateRequest = null;
      if (stateRequestedAgain) {
        stateRequestedAgain = false;
        void fetchState();
      }
    });
    return stateRequest;
  }
  function action(name, input = {}) {
    actionCount++;
    renderBusy();
    const operation = mutationQueue.then(async () => {
      try {
        const payload = await request("./api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, input })
        });
        if (isModel(payload)) acceptModel(payload);
        return { ok: true, payload };
      } catch (error) {
        showError(error, `${name === "inspect" ? "Could not open details" : "Could not complete the action"}: `);
        void fetchState();
        return { ok: false, error };
      } finally {
        actionCount--;
        renderBusy();
      }
    });
    mutationQueue = operation.then(() => void 0, () => void 0);
    return operation;
  }
  function activeQuery() {
    return model?.definition?.request?.query ? model.definition : null;
  }
  function hasDefinition() {
    return Boolean(activeQuery());
  }
  function isUnsupported() {
    return model?.status === "unsupported" || Boolean(model?.definition?.unsupported);
  }
  function queryOperation() {
    const operation = optimisticQuery ?? model?.queryOperation;
    return operation && operation.id !== ignoredQueryOperationId && !["complete", "cancelled"].includes(operation.phase) ? operation : null;
  }
  function isLoading() {
    return model?.status === "loading" || ["validating", "querying"].includes(queryOperation()?.phase);
  }
  function requestedScopeLabel() {
    const scope = queryOperation()?.scope;
    return scope?.subscriptionIds.length === 1 ? scope.subscriptions?.[0]?.name || scope.subscriptionIds[0] : `${scope?.subscriptionIds.length ?? 0} subscriptions`;
  }
  function selection() {
    return desiredSelection ?? new Set(model?.selectedIds ?? []);
  }
  function renderBusy() {
    const authBusy = authPending || Boolean(model?.authOperation);
    for (const id of ["auth-reload", "auth-refresh", "auth-connect", "auth-disconnect"]) {
      if ($(id)) $(id).disabled = !model || authBusy || actionCount > 0 || isLoading() || Boolean(model?.scopeRequest);
    }
    if ($("auth-refresh")) $("auth-refresh").disabled ||= model?.auth?.source === "credential";
    if ($("auth-connect")) $("auth-connect").disabled ||= model?.auth?.source === "credential";
    if ($("auth-cancel")) $("auth-cancel").hidden = !model?.authOperation;
    if ($("auth-status")) $("auth-status").textContent = `${model?.auth?.status ?? "unavailable"} \xB7 ${model?.auth?.source ?? "CLI"} \xB7 external CLI changes require Reload CLI profile`;
    if ($("auth-warnings")) {
      $("auth-warnings").textContent = (model?.auth?.warnings ?? []).map((warning) => typeof warning === "string" ? warning : warning.message).join("\n");
      $("auth-warnings").hidden = !$("auth-warnings").textContent;
    }
    if ($("auth-progress")) {
      $("auth-progress").textContent = model?.authOperation?.progress ?? "";
      $("auth-progress").hidden = !$("auth-progress").textContent;
    }
    $("refresh").disabled = !hasDefinition() || actionCount > 0 || isLoading();
    $("load-more").disabled = actionCount > 0 || isLoading();
    $("scope-toggle").disabled = !model || isLoading();
    $("retry-query").disabled = actionCount > 0 || isLoading();
    $("retry-details").disabled = actionCount > 0;
    $("handoff").disabled = actionCount > 0 || isLoading() || !selection().size;
    $("nl-query").disabled = !model || actionCount > 0;
    $("nl-generate").disabled = !model || actionCount > 0 || isLoading();
    const proposedReady = model?.proposedQuery?.status === "ready";
    $("run-proposed").disabled = !proposedReady || actionCount > 0 || isLoading() || queryRunning || scopePicker.isOpen;
    $("dismiss-proposed").disabled = !proposedReady || actionCount > 0;
  }
  function definitionKey() {
    return JSON.stringify([model?.viewId, model?.definition ?? null]);
  }
  function adoptActiveQuery() {
    const definition = activeQuery();
    queryDraft = definition ? JSON.parse(JSON.stringify(definition)) : {
      connection: null,
      request: { subscriptions: [], query: queryPresets.all }
    };
    draftScope = definition && model.scope ? JSON.parse(JSON.stringify(model.scope)) : null;
    draftDirty = false;
    draftVersion++;
    draftBaseKey = definitionKey();
  }
  function syncQueryDraft() {
    if (!queryDraft || !draftDirty && !queryRunning && !scopePicker.isOpen && draftBaseKey !== definitionKey()) adoptActiveQuery();
  }
  function matchesRun(definition, submitted) {
    if (!definition) return false;
    const subscriptions = (values) => JSON.stringify(values.map(lower).sort());
    return definition.request.query === submitted.request.query && lower(definition.connection.tenantId) === lower(submitted.connection.tenantId) && definition.connection.cloud === submitted.connection.cloud && subscriptions(definition.request.subscriptions) === subscriptions(submitted.request.subscriptions) && Object.entries(submitted.request.options ?? {}).every(([key, value]) => definition.request.options?.[key] === value);
  }
  async function runQuery() {
    if (!model || !queryDraft || queryRunning || actionCount > 0 || isLoading() || scopePicker.isOpen) return;
    if (!queryDraft.connection || !queryDraft.request.subscriptions.length) {
      showError(new Error("Choose a tenant and subscriptions for the draft before running."));
      openPicker();
      return;
    }
    const query = queryDraft.request.query;
    if (!query.trim() || query.length > 2e4) {
      showError(new Error("Enter nonblank KQL with at most 20,000 characters."));
      focusQuery();
      return;
    }
    const submitted = JSON.parse(JSON.stringify(queryDraft));
    const version = draftVersion;
    const viewId = model.viewId;
    draftDirty = true;
    queryRunning = true;
    $("operation-error").hidden = true;
    renderControls();
    const result = await action("run_query", submitted);
    queryRunning = false;
    if (result.ok && model.viewId === viewId && !model.error && !isLoading() && !isUnsupported() && model.source?.query === submitted.request.query && matchesRun(activeQuery(), submitted)) {
      draftBaseKey = definitionKey();
      if (draftVersion === version) draftDirty = false;
    }
    renderControls();
    renderBusy();
    return result;
  }
  async function retryRequestedQuery() {
    const operation = queryOperation();
    if (!operation || operation.phase !== "error" || isLoading() || actionCount > 0) return;
    optimisticQuery = { ...operation, phase: "querying", retry: true };
    render();
    await action("retry_query");
    optimisticQuery = null;
    render();
  }
  function focusQuery() {
    openPicker();
  }
  function submitSuggest() {
    if (!model || actionCount > 0 || isLoading()) return;
    const input = $("nl-query");
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    void action("suggest_query", { text: value });
  }
  function runProposed() {
    const proposed = model?.proposedQuery;
    if (!proposed || proposed.status !== "ready" || queryRunning || actionCount > 0 || isLoading() || scopePicker.isOpen) return;
    syncQueryDraft();
    if (!queryDraft) {
      showError(new Error("The query is not ready. Wait for the view to load, then try again."));
      return;
    }
    queryDraft.request.query = proposed.query;
    if (proposed.title) queryDraft.title = proposed.title;
    else delete queryDraft.title;
    draftDirty = true;
    draftVersion++;
    void runQuery();
  }
  function updateSelection(next) {
    desiredSelection = new Set(next);
    const version = ++selectionVersion;
    renderSelection();
    renderRows();
    void action("select", { ids: [...next] }).then((result) => {
      if (version !== selectionVersion) return;
      desiredSelection = null;
      if (!result.ok) void fetchState();
      renderSelection();
      renderRows();
    });
  }
  function safePortal(value) {
    if (typeof value !== "string") return null;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !portalHosts.has(url.hostname) || url.username || url.password || url.port) return null;
      return url.href;
    } catch {
      return null;
    }
  }
  function portalLink(resource, label, className) {
    const href = safePortal(resource.portalUrl);
    if (!href) return null;
    const link = element("a", className, label);
    link.setAttribute("href", href);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.setAttribute("aria-label", `Open ${text(resource.name)} in Azure portal`);
    link.title = "Open in Azure portal";
    return link;
  }
  function icon(resource) {
    const node = element("span", "resource-icon");
    node.setAttribute("aria-hidden", "true");
    if (typeof resource?.icon === "string" && /^[A-Za-z0-9]+$/.test(resource.icon)) {
      const image = element("img");
      image.alt = "";
      image.setAttribute("src", `./icons/${resource.icon}.svg`);
      image.addEventListener("error", () => {
        image.parentElement?.replaceChildren(createIcon("resources"));
      }, { once: true });
      node.append(image);
    } else node.append(createIcon("resources"));
    return node;
  }
  function formatTime(value) {
    if (!value) return "Not fetched";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Fetch time unavailable";
    return date.toLocaleString(void 0, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function render() {
    const productTitle = "Azure Resources Query";
    const viewTitle = model.definition?.title || "";
    const hasViewTitle = viewTitle && viewTitle !== productTitle;
    $("view-title").textContent = viewTitle;
    $("view-title").title = viewTitle;
    $("view-title").hidden = !hasViewTitle;
    document.title = hasViewTitle ? `${viewTitle} \xB7 ${productTitle}` : productTitle;
    const unsupported = isUnsupported();
    $("state-badge").hidden = !unsupported;
    $("truth-label").textContent = unsupported ? "This saved view cannot be executed" : "Resources visible to this account";
    const headerScope = queryOperation()?.scope ?? draftScope;
    const subscriptionId = model.scope?.subscriptionIds.length === 1 ? model.scope.subscriptionIds[0] : null;
    if (!unsupported && subscriptionId && (headerScope?.subscriptionIds.length !== 1 || lower(headerScope.subscriptionIds[0]) !== lower(subscriptionId) || lower(headerScope.tenantId) !== lower(model.scope.tenantId) || headerScope.cloud !== model.scope.cloud)) {
      const subscriptionName = model.scope.subscriptions?.find((entry) => lower(entry.id) === lower(subscriptionId))?.name || subscriptionId;
      $("truth-label").textContent += ` \xB7 Results from ${subscriptionName}`;
    }
    $("back").disabled = !model.history?.canBack || isLoading();
    $("forward").disabled = !model.history?.canForward || isLoading();
    $("inventory-error").hidden = !model.error;
    $("inventory-error").textContent = model.error ? `Request failed: ${model.error.message}${model.rows.length ? " Previously loaded results remain below." : ""}` : "";
    $("retry-query").hidden = queryOperation()?.phase !== "error";
    $("notice").hidden = !model.notice;
    $("notice").textContent = model.notice || "";
    const count = model.rows.length;
    $("results-count").textContent = model.total == null ? `${count.toLocaleString()} loaded \xB7 total unknown` : `${count.toLocaleString()} of ${model.total.toLocaleString()} resources`;
    if (!hasDefinition()) $("results-count").textContent = unsupported ? "Unsupported saved view" : "Resources";
    $("loading-status").hidden = !isLoading();
    $("loading-status").textContent = queryOperation() && isLoading() ? `Loading resources in ${requestedScopeLabel()}\u2026` : count ? "Updating \xB7 previous results" : "Loading\u2026";
    $("resource-list").setAttribute("aria-busy", String(isLoading()));
    const source = model.source;
    const partial = model.partial || source?.partial === true || source?.complete === false || source?.resultTruncated === true;
    const pagingUnsupported = source?.paginationSupported === false;
    const pagingWarning = source?.paginationWarning || (pagingUnsupported ? "Pagination is unavailable for this query. Review the query limits before treating the loaded results as a full inventory." : source?.resultTruncated === true ? "The source truncated these results." : "");
    $("pagination-warning").hidden = !hasDefinition() || !pagingWarning;
    $("pagination-warning").textContent = pagingWarning;
    $("paging").hidden = !hasDefinition() || !partial && !model.hasMore;
    $("load-more").hidden = !model.hasMore;
    $("page-note").textContent = model.hasMore ? "More results are available." : "Partial results \xB7 this is not the complete inventory.";
    const parts = [`Source: ${source?.label || "Azure Resource Graph"}`];
    const fetchedAt = source?.fetchedAt || model.fetchedAt;
    parts.push(fetchedAt ? `Fetched ${formatTime(fetchedAt)}` : "Not fetched");
    if (source?.timeRange) parts.push(`Time range: ${source.timeRange}`);
    if (partial) parts.push("Partial collection");
    if (pagingUnsupported) parts.push("Pagination unavailable for this query");
    if (model.hasMore) parts.push("More pages available");
    if (isLoading() && count) parts.push("Showing previous results while updating");
    $("freshness").textContent = !hasDefinition() && queryOperation() ? isLoading() ? `Loading resources in ${requestedScopeLabel()}\u2026` : "The requested query failed. Retry the request or choose a different scope." : hasDefinition() ? parts.join(" \xB7 ") : unsupported ? "No executable query or results in this saved view. Start an ARG query or use view history." : "Choose an explicit scope to begin. No subscriptions are selected automatically.";
    $("freshness").title = model.fetchedAt || source?.fetchedAt || "";
    renderControls();
    renderProposal();
    renderPicker();
    renderRows();
    renderSelection();
    renderDetails();
    renderBusy();
    $("live-summary").textContent = isLoading() ? queryOperation() ? `Loading resources in ${requestedScopeLabel()}\u2026` : "Updating resource results." : `${count} resources loaded. ${selection().size} selected.`;
  }
  function renderControls() {
    if (!model) return;
    $("executed-query").hidden = !model.source?.query;
    $("executed-query-content").textContent = model.source?.query || "";
    $("copy-query").disabled = !model.source?.query;
  }
  function renderProposal() {
    const proposed = model?.proposedQuery;
    const ready = proposed?.status === "ready";
    $("proposed-query").hidden = !ready;
    $("proposed-content").textContent = ready ? proposed.query : "";
    $("proposed-note").textContent = ready ? proposed.note || "" : "";
  }
  function emptyState(title, description, label, onClick) {
    const node = element("div", "empty-state");
    const mark = element("span", "empty-mark");
    mark.append(createIcon("resources"));
    mark.setAttribute("aria-hidden", "true");
    node.append(mark, element("h3", "", title), element("p", "", description));
    if (label) node.append(button(label, "secondary-button", onClick));
    return node;
  }
  function renderInitialFailure() {
    $("resource-list").setAttribute("aria-busy", "false");
    $("resource-list").replaceChildren(emptyState("Unable to load this view", "The browser could not read its saved state. You can retry without losing the view.", "Try again", () => void fetchState()));
    $("freshness").textContent = "The last request failed. No results have been loaded.";
  }
  function renderRows() {
    if (!model) return;
    const ids = [...selection()].map(lower);
    const showSubscription = model.scope?.subscriptionIds.length !== 1;
    const signature = JSON.stringify([model.rows, showSubscription, ids, model.focusedId, model.status, Boolean(model.definition), model.error, model.accountError, queryOperation()]);
    if (signature === listSignature) return;
    listSignature = signature;
    const scroll = $("resource-scroll");
    if (scroll.clientHeight && !restoringScroll) scrollTop = scroll.scrollTop || scrollTop;
    const savedScroll = scrollTop;
    const focusedRow = document.activeElement?.closest(".resource-row");
    const focusedControl = focusedRow ? { id: focusedRow.dataset.resourceId, control: document.activeElement.dataset.control } : null;
    const fragment = document.createDocumentFragment();
    if (!hasDefinition() && queryOperation()) {
      fragment.append(isLoading() ? emptyState("Loading resources", `Loading resources in ${requestedScopeLabel()}\u2026`) : emptyState("Resources could not be loaded", "The request failed. Retry the confirmed query without returning to chat.", "Retry request", () => void retryRequestedQuery()));
    } else if (isUnsupported()) {
      fragment.append(emptyState("This saved view is unsupported", "Legacy snapshot data is preserved in the v1 backup, but cannot be executed here. Start an ARG query or navigate to another view in history.", "Start a query", focusQuery));
    } else if (!hasDefinition()) {
      fragment.append(emptyState("Start with an ARG query", "Choose a tenant and subscriptions to run the active query. Your CLI default is a suggestion, not an automatic selection.", "Choose scope", focusQuery));
    } else if (!model.rows.length) {
      fragment.append(isLoading() ? emptyState("Loading resources", "Querying your selected scope. Results will appear here.") : model.error ? emptyState("Resources could not be loaded", "Check the error above. Retry request reruns the active query, or choose a different scope.", "Choose scope", focusQuery) : emptyState("No matching resources", "No resources visible to this account match the executed KQL in the selected scope.", "Choose scope", focusQuery));
    } else {
      const selected = new Set(ids);
      for (const row of model.rows) fragment.append(resourceRow(row, selected.has(lower(row.id)), showSubscription));
    }
    restoringScroll = true;
    $("resource-list").replaceChildren(fragment);
    requestAnimationFrame(() => {
      if (scroll.clientHeight) {
        scroll.scrollTop = savedScroll;
        scrollTop = scroll.scrollTop;
      }
      restoringScroll = false;
      if (focusedControl && (!document.activeElement || document.activeElement === document.body)) {
        const row = [...$("resource-list").children].find((node) => node.dataset.resourceId === focusedControl.id);
        const control = row && [...row.querySelectorAll("[data-control]")].find((node) => node.dataset.control === focusedControl.control);
        control?.focus({ preventScroll: true });
      }
    });
  }
  function resourceRow(row, selected, showSubscription) {
    const node = element("article", `resource-row canvas-list-row${selected ? " is-selected" : ""}${lower(model.focusedId) === lower(row.id) ? " is-focused" : ""}${isLoading() ? " is-stale" : ""}`);
    node.dataset.resourceId = row.id;
    const checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected;
    checkbox.disabled = isLoading();
    checkbox.dataset.control = "select";
    checkbox.setAttribute("aria-label", `Select ${text(row.name)}`);
    checkbox.addEventListener("change", () => {
      const next = new Set(selection());
      const existing = [...next].find((id) => lower(id) === lower(row.id));
      if (checkbox.checked) next.add(row.id);
      else if (existing) next.delete(existing);
      updateSelection(next);
    });
    const content = element("div", "resource-copy");
    const name = button(text(row.name), "resource-name canvas-list-title", () => void inspectResource(row));
    name.title = `${text(row.name)}
${row.id}`;
    name.disabled = isLoading();
    name.dataset.control = "inspect";
    const type = element("span", "resource-type", row.typeLabel || row.type || "Type unavailable");
    type.title = [row.type, row.kind].filter(Boolean).join(" \xB7 ");
    const meta = element("div", "resource-meta canvas-list-description");
    meta.append(type);
    for (const [value, label, className] of [
      [row.resourceGroup, "Resource group", ""],
      [formatAzureLocation(row.location), "Location", ""],
      ...showSubscription ? [[row.subscriptionName || row.subscriptionId, "Subscription", "subscription-meta"]] : []
    ]) {
      const span = element("span", className, value || `${label} unavailable`);
      span.title = `${label}: ${text(value)}`;
      meta.append(span);
    }
    content.append(name, meta);
    const actions = element("div", "row-actions");
    const copyId = button("", "icon-button copy-row", () => void copy(row.id, "Resource ID"), `Copy ID for ${text(row.name)}`);
    copyId.append(createIcon("copy"));
    copyId.dataset.control = "copy";
    actions.append(copyId);
    const portal = portalLink(row, "", "icon-button");
    if (portal) {
      portal.append(createIcon("external-link"));
      portal.dataset.control = "portal";
      actions.append(portal);
    }
    node.append(checkbox, icon(row), content, actions);
    return node;
  }
  function inspectResource(row) {
    return action("inspect", { id: row.id });
  }
  function renderSelection() {
    const selected = new Set([...selection()].map(lower));
    const visibleCount = model?.rows.filter((row) => selected.has(lower(row.id))).length ?? 0;
    const outside = selected.size - visibleCount;
    $("selection-toolbar").hidden = !selected.size;
    $("selection-count").textContent = `${selected.size.toLocaleString()} selected`;
    $("selection-outside").textContent = outside ? `${outside} outside current results \xB7 ${visibleCount} loaded` : `${visibleCount} in loaded results`;
    $("select-loaded").disabled = !model?.rows.length || isLoading();
    $("select-loaded").checked = Boolean(model?.rows.length) && visibleCount === model.rows.length;
    $("select-loaded").indeterminate = visibleCount > 0 && visibleCount < (model?.rows.length ?? 0);
    renderBusy();
  }
  function openPicker() {
    renderPicker();
    scopePicker.open();
    renderControls();
    renderBusy();
  }
  function pickerOpenChanged(open) {
    if (!open) {
      syncQueryDraft();
      renderPicker();
    }
    renderControls();
    renderBusy();
    if (!open && runAfterScopeApply) {
      runAfterScopeApply = false;
      void runQuery();
    }
  }
  function renderPicker() {
    if (!model || pickerRendering) return;
    pickerRendering = true;
    try {
      if (scopeSubmitting) return;
      const pending = model.scopeRequest?.id === dismissedScopeRequestId ? null : model.scopeRequest;
      if (pending) {
        const isNew = pending.id !== activeScopeRequest?.id;
        if (isNew && scopePicker.isOpen) scopePicker.close();
        activeScopeRequest = pending;
        scopePicker.setState({
          accounts: pending.accounts,
          revision: model.revision,
          scope: null,
          ...isNew ? { selectedKeys: [] } : {},
          refreshDisabledReason: "Finish or cancel this scope request before refreshing subscriptions.",
          error: scopeResponseError?.id === pending.id ? scopeResponseError.message : model.accountError?.message || null
        });
        if (isNew) scopePicker.open({ confirmDefault: pending.confirmDefault });
        return;
      }
      if (activeScopeRequest) {
        activeScopeRequest = null;
        scopePicker.close();
      }
      const requestedScope = queryOperation()?.scope;
      scopePicker.setState({
        accounts: model.accounts,
        revision: model.revision,
        selectedKeys: void 0,
        scope: requestedScope ?? draftScope,
        refreshDisabledReason: null,
        error: model.accountError
      });
    } finally {
      pickerRendering = false;
    }
  }
  async function applyScope(scope) {
    if (activeScopeRequest) {
      const requestId = activeScopeRequest.id;
      scopeSubmitting = true;
      const suppliedQuery = activeScopeRequest.query;
      if (suppliedQuery) {
        const connection = { tenantId: scope.tenantId, cloud: scope.cloud };
        optimisticQuery = {
          id: requestId,
          phase: "validating",
          definition: { ...suppliedQuery, connection, request: { ...suppliedQuery.request, subscriptions: scope.subscriptionIds } },
          scope
        };
        scopePicker.setState({ selectedKeys: scope.selectedKeys });
        render();
      }
      try {
        await request("./api/scope-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, selectedKeys: scope.selectedKeys })
        });
        dismissedScopeRequestId = requestId;
        if (activeScopeRequest?.id === requestId) activeScopeRequest = null;
      } catch (error) {
        if (suppliedQuery && model.queryOperation?.id === requestId) {
          dismissedScopeRequestId = requestId;
          activeScopeRequest = null;
          optimisticQuery = null;
          return;
        }
        if (suppliedQuery) {
          optimisticQuery = null;
          scopePicker.setState({ selectedKeys: [] });
          render();
        }
        void fetchState();
        throw error;
      } finally {
        scopeSubmitting = false;
        renderControls();
        renderBusy();
      }
      return;
    }
    if (!queryDraft) throw new Error("The query is not ready. Wait for the view to load, then choose subscriptions.");
    ignoredQueryOperationId = queryOperation()?.id ?? null;
    optimisticQuery = null;
    queryDraft.connection = { tenantId: scope.tenantId, cloud: scope.cloud };
    queryDraft.request.subscriptions = [...scope.subscriptionIds];
    draftScope = scope;
    draftDirty = true;
    draftVersion++;
    render();
    runAfterScopeApply = true;
  }
  function cancelScopeRequest() {
    if (!activeScopeRequest || scopeSubmitting) return;
    const requestId = activeScopeRequest.id;
    activeScopeRequest = null;
    dismissedScopeRequestId = requestId;
    if (model.scopeRequest?.id !== requestId) return;
    void request("./api/scope-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, cancelled: true })
    }).then(() => fetchState()).catch((error) => {
      showError(error, "Could not cancel scope selection: ");
      scopeResponseError = { id: requestId, message: `Could not cancel scope selection: ${error.message}. Try again.` };
      if (dismissedScopeRequestId === requestId) dismissedScopeRequestId = null;
      void fetchState();
    });
  }
  function detailResource() {
    if (lower(model?.details?.resource?.id) === lower(model?.focusedId)) return model.details.resource;
    return model?.rows.find((row) => lower(row.id) === lower(model.focusedId)) || { id: model?.focusedId };
  }
  function renderDetails() {
    const showing = Boolean(model?.focusedId);
    const wasShowing = $("workspace").classList.contains("has-details");
    $("details-panel").hidden = !showing;
    $("workspace").classList.toggle("has-details", showing);
    if (!showing) {
      if (wasShowing) requestAnimationFrame(() => {
        $("resource-scroll").scrollTop = scrollTop;
      });
      return;
    }
    const resource = detailResource();
    const signature = JSON.stringify([model.focusedId, resource, model.details, model.detailsError]);
    if (signature === detailsSignature) return;
    detailsSignature = signature;
    $("detail-name").textContent = text(resource.name);
    $("detail-type").textContent = resource.typeLabel || resource.type || "Type unavailable";
    $("detail-id").textContent = resource.id || "";
    $("detail-icon").replaceChildren(...icon(resource).childNodes);
    const href = safePortal(resource.portalUrl);
    $("detail-portal").hidden = !href;
    if (href) $("detail-portal").setAttribute("href", href);
    else $("detail-portal").removeAttribute("href");
    $("copy-id").disabled = !resource.id;
    $("details-loading").hidden = Boolean(model.details || model.detailsError);
    $("details-error").hidden = !model.detailsError;
    $("retry-details").hidden = !model.detailsError;
    $("details-error").textContent = model.detailsError ? `Details could not be fetched: ${model.detailsError.message}. Inventory values are shown when available.` : "";
    const detailsSource = typeof model.details?.source === "string" ? model.details.source : model.details?.source?.label;
    $("detail-source").textContent = model.details ? `${detailsSource || "Resource details"} \xB7 Fetched ${formatTime(model.details.fetchedAt)} \xB7 Read-only` : "Inventory values \xB7 detail properties have not been fetched.";
    renderDetailBody(resource);
  }
  function detailValue(value) {
    if (value === null || value === void 0 || value === "") return "";
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  function detailGrid(entries) {
    const list = element("dl", "detail-grid");
    let count = 0;
    for (const [key, raw] of entries) {
      const value = detailValue(raw);
      if (!value) continue;
      const row = element("div", "detail-row");
      row.append(element("dt", "", key), element("dd", "", value));
      list.append(row);
      count += 1;
    }
    return count ? list : null;
  }
  function detailSection(title, node) {
    if (!node) return null;
    const section = element("section", "detail-section");
    section.append(element("h3", "detail-section-title", title), node);
    return section;
  }
  const CORE_FIELD_KEYS = /* @__PURE__ */ new Set(["name", "id", "type", "kind", "location", "resourcegroup", "resourcegroupname", "subscriptionid", "subscriptionname", "subscription", "sku", "provisioningstate", "tags", "properties"]);
  function renderDetailBody(resource) {
    const nodes = [];
    const overview = detailSection("Overview", detailGrid([
      ["Resource group", resource.resourceGroup],
      ["Subscription", resource.subscriptionName || resource.subscriptionId],
      ["Location", formatAzureLocation(resource.location)],
      ["Kind", resource.kind],
      ["SKU", resource.sku],
      ["Provisioning state", resource.provisioningState]
    ]));
    if (overview) nodes.push(overview);
    const queryFields = Object.entries(resource.fields ?? {}).filter(([key]) => !CORE_FIELD_KEYS.has(lower(key)));
    const query = detailSection("From your query", detailGrid(queryFields));
    if (query) nodes.push(query);
    const tags = resource.tags && typeof resource.tags === "object" ? Object.entries(resource.tags) : [];
    const tagsSection = detailSection("Tags", detailGrid(tags));
    if (tagsSection) nodes.push(tagsSection);
    const properties = model.details?.properties;
    if (properties !== null && properties !== void 0) {
      const json = JSON.stringify(properties, null, 2);
      const section = element("section", "detail-section");
      const head = element("div", "detail-section-head");
      head.append(element("h3", "detail-section-title", "Properties"));
      head.append(button("Copy JSON", "text-button", () => void copy(json, "Resource properties")));
      const wrap = element("details", "json-block");
      wrap.append(element("summary", "json-summary", "Show raw JSON"), element("pre", "json-properties", json));
      section.append(head, wrap);
      nodes.push(section);
    }
    if (!nodes.length) nodes.push(element("p", "muted small", "No additional details are available for this resource."));
    $("detail-body").replaceChildren(...nodes);
  }
  $("dismiss-error").addEventListener("click", () => {
    $("operation-error").hidden = true;
  });
  $("retry-query").addEventListener("click", () => void retryRequestedQuery());
  $("copy-query").addEventListener("click", () => void copy(model?.source?.query, "Executed query"));
  $("refresh").addEventListener("click", () => void action("refresh"));
  async function authentication(name) {
    if (name !== "cancel" && authPending) return;
    const tenantId = $("auth-tenant").value.trim();
    const input = name === "connect" ? {
      ...tenantId ? { tenantId } : {},
      flow: $("auth-flow").value,
      allowNoSubscriptions: true
    } : {};
    if (name !== "cancel") {
      authPending = true;
      actionCount++;
      renderBusy();
    }
    try {
      acceptModel(await request("./api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, input })
      }));
    } catch (error) {
      showError(error);
      void fetchState();
    } finally {
      if (name !== "cancel") {
        authPending = false;
        actionCount--;
        renderBusy();
      }
    }
  }
  for (const name of ["reload", "refresh", "connect", "disconnect", "cancel"]) {
    $(`auth-${name}`)?.addEventListener("click", () => void authentication(name));
  }
  $("nl-generate").addEventListener("click", submitSuggest);
  $("nl-query").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      submitSuggest();
    }
  });
  $("run-proposed").addEventListener("click", runProposed);
  $("dismiss-proposed").addEventListener("click", () => void action("dismiss_proposal"));
  $("back").addEventListener("click", () => void action("back"));
  $("forward").addEventListener("click", () => void action("forward"));
  $("load-more").addEventListener("click", () => void action("load_more"));
  $("select-loaded").addEventListener("change", () => {
    const next = new Set(selection());
    if ($("select-loaded").checked) for (const row of model.rows) next.add(row.id);
    else {
      const visible = new Set(model.rows.map((row) => lower(row.id)));
      for (const id of next) if (visible.has(lower(id))) next.delete(id);
    }
    updateSelection(next);
  });
  $("clear-selection").addEventListener("click", () => {
    const version = ++selectionVersion;
    desiredSelection = /* @__PURE__ */ new Set();
    renderSelection();
    renderRows();
    void action("clear_selection").then(() => {
      if (version === selectionVersion) desiredSelection = null;
      renderSelection();
      renderRows();
    });
  });
  $("handoff").addEventListener("click", async () => {
    const result = await action("handoff");
    if (result.ok) toast("Selection added to chat");
  });
  $("close-details").addEventListener("click", async () => {
    const focused = model?.focusedId;
    const result = await action("dismiss_details");
    if (result.ok) {
      const name = [...$("resource-list").querySelectorAll(".resource-name")].find((node) => node.title.endsWith(`
${focused}`));
      (name || $("resource-scroll")).focus({ preventScroll: true });
    }
  });
  $("copy-id").addEventListener("click", () => void copy(detailResource().id, "Resource ID"));
  $("retry-details").addEventListener("click", () => {
    if (model?.focusedId) void action("inspect", { id: model.focusedId });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented || scopePicker.isOpen) return;
    if (model?.focusedId) $("close-details").click();
  });
  $("resource-scroll").addEventListener("scroll", () => {
    if (!$("resource-scroll").clientHeight || restoringScroll) return;
    scrollTop = $("resource-scroll").scrollTop;
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
      if (!model) return;
      try {
        sessionStorage.setItem(`azure-resources:scroll:${model.viewId}`, String(scrollTop));
      } catch {
      }
    }, 150);
  }, { passive: true });
  matchMedia("(min-width: 900px)").addEventListener("change", () => {
    requestAnimationFrame(() => {
      if ($("resource-scroll").clientHeight) $("resource-scroll").scrollTop = scrollTop;
    });
  });
  function syncColorScheme() {
    const root = document.documentElement;
    const declared = root.getAttribute("data-color-mode") || document.body.getAttribute("data-color-mode");
    let mode = declared === "dark" || declared === "light" ? declared : "";
    if (!mode && getComputedStyle(root).getPropertyValue("--background-color-default").trim()) {
      const values = getComputedStyle(document.body).backgroundColor.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
      if (values) mode = Number(values[1]) * 0.2126 + Number(values[2]) * 0.7152 + Number(values[3]) * 0.0722 < 128 ? "dark" : "light";
    }
    if (mode) root.setAttribute("data-ui-color-scheme", mode);
    else root.removeAttribute("data-ui-color-scheme");
  }
  const themeObserver = new MutationObserver(syncColorScheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "data-color-mode"] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["style", "data-color-mode"] });
  themeObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
  syncColorScheme();
  const themeTimer = setTimeout(syncColorScheme, 800);
  const events = new EventSource("./events");
  events.addEventListener("change", () => void fetchState());
  events.addEventListener("error", () => {
    $("connection-status").textContent = "Live updates disconnected. Reconnecting automatically; existing results are unchanged.";
    $("connection-status").hidden = false;
  });
  events.addEventListener("open", () => {
    $("connection-status").hidden = true;
    void fetchState();
  });
  window.addEventListener("pagehide", () => {
    closed = true;
    scopePicker.destroy();
    events.close();
    themeObserver.disconnect();
    clearTimeout(themeTimer);
    clearTimeout(scrollSaveTimer);
    clearTimeout(toastTimer);
  });
  void fetchState();
})();
