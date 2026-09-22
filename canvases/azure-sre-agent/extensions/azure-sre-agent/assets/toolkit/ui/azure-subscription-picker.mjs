// packages/canvas-toolkit/src/ui/azure-subscription-picker.mjs
import { createSubscriptionPicker } from "./subscription-picker.mjs";
var lower = (value) => String(value ?? "").toLowerCase();
var accountKey = (account) => account.key ?? JSON.stringify([account.cloud, lower(account.tenantId), lower(account.id), lower(account.accountName)]);
var sameSubscription = (left, right) => lower(left.id) === lower(right.id) && lower(left.tenantId) === lower(right.tenantId) && left.cloud === right.cloud;
var needsAzureLoginHelp = (error) => {
  if (!error || typeof error === "string") return false;
  return ["signed-out", "login-required", "authentication-required", "no-accounts"].includes(lower(error.code));
};
function pickerAccounts(accounts) {
  const identities = /* @__PURE__ */ new Map();
  const identityKey = (account) => JSON.stringify([account.cloud, lower(account.tenantId), lower(account.id)]);
  for (const account of accounts) {
    const key = identityKey(account);
    if (!identities.has(key)) identities.set(key, /* @__PURE__ */ new Set());
    identities.get(key).add(lower(account.accountName));
  }
  return [...new Map(accounts.map((account) => {
    const ambiguous = identities.get(identityKey(account)).size > 1;
    const disabledReason = account.disabledReason || (ambiguous ? "Cached under multiple accounts. Sign in explicitly in your terminal, then use Refresh subscriptions." : account.state && lower(account.state) !== "enabled" ? `Subscription is ${account.state}.` : "");
    return [accountKey(account), {
      key: accountKey(account),
      id: account.id,
      name: account.name || account.id,
      tenantId: account.tenantId,
      tenantName: account.tenantName,
      cloud: account.cloud,
      isDefault: !!account.isDefault,
      disabled: !!account.disabled || !!disabledReason,
      disabledReason
    }];
  })).values()];
}
function createAzureSubscriptionPicker({
  document = globalThis.document,
  transport,
  onApply,
  statusMount,
  ...options
} = {}) {
  if (typeof transport !== "function") throw new TypeError("A subscription refresh transport is required.");
  if (typeof onApply !== "function") throw new TypeError("A selected-scope callback is required.");
  let state = { accounts: [], scope: null, error: null };
  let destroyed = false;
  let revision = 0;
  let version = 0;
  const status = document.createElement("div");
  status.className = "canvas-azure-subscription-picker-status";
  status.setAttribute("role", "alert");
  status.hidden = true;
  statusMount?.append(status);
  const picker = createSubscriptionPicker({
    ...options,
    document,
    singleGroup: true,
    onApply: async (items) => {
      const available = pickerAccounts(state.accounts);
      if (!items.length || items.length > 1e3 || items.some((item) => !available.some((candidate) => candidate.key === item.key && !candidate.disabled))) {
        throw new Error("Choose between 1 and 1000 available subscriptions. Refresh subscriptions if access has changed.");
      }
      const first = items[0];
      if (items.some((item) => lower(item.tenantId) !== lower(first.tenantId) || item.cloud !== first.cloud)) {
        throw new Error("Choose subscriptions from one tenant and cloud.");
      }
      const principals = new Set(items.map((item) => lower(state.accounts.find((account) => accountKey(account) === item.key)?.accountName)));
      if (principals.size > 1) throw new Error("Choose subscriptions from a single Azure account. The CLI cannot bind a scope across multiple principals.");
      await onApply({
        tenantId: first.tenantId,
        tenantName: first.tenantName,
        cloud: first.cloud,
        subscriptionIds: items.map((item) => item.id),
        subscriptions: items.map(({ id, name }) => ({ id, name })),
        selectedKeys: items.map((item) => item.key)
      });
    },
    onRefresh: async () => {
      const started = version;
      const snapshot = await transport();
      if (destroyed) return;
      if (!snapshot || !Array.isArray(snapshot.accounts)) throw new Error("The subscription service returned an invalid response.");
      if (snapshot.revision !== void 0 && snapshot.revision < revision || snapshot.revision === void 0 && version !== started) return;
      setState({ accounts: snapshot.accounts, error: snapshot.error, ...snapshot.revision === void 0 ? {} : { revision: snapshot.revision } });
    }
  });
  function setState(update) {
    if (destroyed) return;
    if (update.revision !== void 0 && update.revision < revision) return;
    if (update.accounts !== void 0 && !Array.isArray(update.accounts)) throw new TypeError("accounts must be an array.");
    revision = update.revision ?? revision;
    version++;
    state = { ...state, ...update };
    const subscriptions = pickerAccounts(state.accounts);
    const selectedKeys = state.selectedKeys === void 0 ? [] : [...state.selectedKeys];
    if (state.selectedKeys === void 0) {
      for (const id of state.scope?.subscriptionIds ?? []) {
        let item = subscriptions.find((account) => sameSubscription(account, { ...state.scope, id }));
        if (!item) {
          item = {
            key: JSON.stringify([state.scope.cloud, lower(state.scope.tenantId), lower(id), "unavailable"]),
            id,
            name: state.scope.subscriptions?.find((account) => lower(account.id) === lower(id))?.name || id,
            tenantId: state.scope.tenantId,
            cloud: state.scope.cloud,
            disabled: true,
            disabledReason: "This subscription is no longer available. Refresh subscriptions or choose another subscription."
          };
          subscriptions.push(item);
        }
        selectedKeys.push(item.key);
      }
    }
    const message = typeof state.error === "string" ? state.error : state.error?.message;
    const command = state.scope?.tenantId ? `az login --tenant ${state.scope.tenantId}` : "az login";
    const help = message ? needsAzureLoginHelp(state.error) ? `${message} Sign in with Azure CLI using ${command}, then use Refresh subscriptions.` : message : !state.accounts.length ? "No Azure subscriptions are available. Run az login in a terminal, then use Refresh subscriptions." : "";
    status.textContent = help;
    status.hidden = !help;
    picker.setState({
      subscriptions,
      selectedKeys,
      error: help || null,
      loading: !!state.loading,
      refreshDisabledReason: state.refreshDisabledReason ?? null
    });
  }
  return {
    trigger: picker.trigger,
    dialog: picker.dialog,
    status,
    setState,
    open: (options2) => picker.open(options2),
    close: (options2) => picker.close(options2),
    get isOpen() {
      return picker.isOpen;
    },
    destroy() {
      destroyed = true;
      picker.destroy();
      status.remove();
    }
  };
}
export {
  createAzureSubscriptionPicker
};
