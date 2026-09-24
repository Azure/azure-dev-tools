import "@microsoft/canvas-toolkit/ui/styles.css";
import "@microsoft/canvas-toolkit/ui/subscription-picker.css";
import { createAzureSubscriptionPicker } from "@microsoft/canvas-toolkit/ui/azure-subscription-picker";
import { formatAzureLocation } from "@microsoft/canvas-toolkit/ui/locations";
import "./app.css";

const element = id => document.getElementById(id);
let version = -1;
let model;
let pending = 0;
let ready = false;
let fileBuild;
function showError(error) {
    element("error").textContent = error.message;
    element("error").hidden = false;
}
function controls() {
    const loading = model?.status === "loading";
    element("profile").disabled = !ready || pending > 0 || model?.status === "loading-profile";
    element("scope").disabled = !ready || model?.profile !== "connected" || model?.status === "loading-profile";
    element("list").disabled = !ready || pending > 0 || !model?.scope;
    element("cancel").disabled = !ready || !loading;
}
const picker = createAzureSubscriptionPicker({
    id: "builder-subscription", trigger: element("scope"), selectionMode: "single",
    transport: async () => {
        const snapshot = await act("reload_profile", {});
        return { accounts: snapshot.model.accounts, error: snapshot.model.error, revision: snapshot.version };
    },
    onApply: scope => act("select_subscription", {
        subscriptionId: scope.subscriptionIds[0], tenantId: scope.tenantId, cloud: scope.cloud,
    }),
});
function render(snapshot) {
    if (snapshot.version < version) return;
    version = snapshot.version;
    model = snapshot.model;
    ready = true;
    element("build").textContent = "Provider build: " + snapshot.build.id;
    element("source").textContent = model.mode === "fixture"
        ? "SYNTHETIC DEMO - no Azure calls. These are invented sample resources."
        : "LIVE AZURE - your selected subscription; explicit reads only.";
    element("selection").textContent = model.scope
        ? `Selected: ${model.scope.subscriptions.map(item => item.name).join(", ")} (${model.scope.cloud})`
        : "No subscription selected.";
    element("status").textContent = model.status === "complete"
        ? `${model.rows.length} resource groups loaded${model.mode === "fixture" ? " (synthetic)" : ""}.`
        : model.status.replaceAll("-", " ");
    element("rows").replaceChildren(...model.rows.map(row => {
        const item = document.createElement("li");
        item.textContent = `${row.name} - ${formatAzureLocation(row.location)}`;
        return item;
    }));
    if (model.error) showError(model.error);
    else element("error").hidden = true;
    if (fileBuild && fileBuild.id !== snapshot.build.id) {
        showError(new Error("Files and provider builds differ. Reload the extension provider, then reopen this panel."));
    }
    picker.setState({ accounts: model.accounts, scope: model.scope, revision: snapshot.version,
        loading: model.status === "loading-profile", error: model.error });
    controls();
}
async function request(route, options) {
    const response = await fetch(new URL(route, location.href), options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? `Request failed: ${response.status}`);
    return result;
}
async function refresh() {
    try { render(await request("api/state")); }
    catch (error) { ready = false; controls(); showError(error); }
}
async function act(name, input) {
    pending++;
    controls();
    element("error").hidden = true;
    try {
        const snapshot = await request("api/action", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, input }),
        });
        render(snapshot);
        return snapshot;
    } finally {
        pending--;
        controls();
    }
}
for (const [id, name] of [["profile", "reload_profile"], ["list", "list_resource_groups"], ["cancel", "cancel"]]) {
    element(id).addEventListener("click", () => act(name, {}).catch(showError));
}
const events = new EventSource(new URL("events", location.href));
events.addEventListener("change", refresh);
events.onopen = () => { element("connection").textContent = "Connected"; };
events.onerror = () => {
    ready = false;
    controls();
    element("connection").textContent = "Connection lost; reconnecting...";
};
window.addEventListener("pagehide", () => { events.close(); picker.destroy(); });
try {
    fileBuild = await request("build.json");
    await refresh();
} catch (error) {
    showError(error);
}
