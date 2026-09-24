import assert from "node:assert/strict";
import { registrations } from "./host-double.mjs";
import { app, assertShutdownOwnership } from "../dist/toolkit.mjs";
import { canvasUiAssets } from "../dist/assets/toolkit/ui.mjs";

await import("../dist/extension.mjs");
assertShutdownOwnership();
assert.equal(registrations.length, 1);
const [canvas] = registrations[0].canvases;
assert.equal(canvas.id, "__CANVAS_NAME__");
assert.deepEqual(canvas.actions.map(action => action.name),
    ["get_state", "reload_profile", "select_subscription", "list_resource_groups", "cancel"]);
const ctx = { sessionId: "toolkit-check", extensionId: "test:__CANVAS_NAME__",
    canvasId: "__CANVAS_NAME__", instanceId: "check-panel", input: { mode: "fixture" },
    host: { capabilities: { "canvas-renderer": true } } };
const originalOpen = app.definition.open;
const originalClose = app.definition.onClose;
let openContext;
let closeContext;
app.definition.open = input => { openContext = input; return originalOpen(input); };
app.definition.onClose = input => { closeContext = input; return originalClose(input); };
try {
    const invoke = (name, input = {}) => canvas.actions.find(action => action.name === name).handler({ ...ctx, input });
    const { url } = await canvas.open(ctx);
    assert.equal(openContext, ctx);
    assert.equal((await fetch(url)).status, 200);
    const identity = await (await fetch(new URL("build.json", url))).json();
    assert.match(identity.id, /^[a-f0-9]{12}$/);
    assert.equal((await invoke("get_state")).build.id, identity.id);
    for (const [route, [, mime]] of canvasUiAssets) {
        const response = await fetch(new URL(route, url));
        assert.equal(response.status, 200, `Missing toolkit asset: ${route}`);
        assert.equal(response.headers.get("content-type"), mime, route);
        assert.ok((await response.arrayBuffer()).byteLength > 0, route);
    }
    assert.equal((await invoke("get_state")).model.status, "not-loaded");
    await assert.rejects(invoke("list_resource_groups"), { code: "invalid_input" });
    const profile = await invoke("reload_profile");
    const [account] = profile.model.accounts;
    assert.equal(profile.model.scope, null);
    await invoke("select_subscription", { subscriptionId: account.id, tenantId: account.tenantId, cloud: account.cloud });
    const result = await invoke("list_resource_groups");
    assert.equal(result.model.rows.length, 3);
    assert.equal(result.model.mode, "fixture");
    assert.equal((await (await fetch(new URL("api/state", url))).json()).version, result.version);
    await assert.rejects(invoke("list_resource_groups", { extra: true }), { code: "invalid_input" });
    await canvas.onClose(ctx);
    assert.equal(closeContext, ctx);
    await assert.rejects(fetch(url));
    console.log("Azure lesson registration ready (synthetic transport + test SDK seam; not native-host or live-Azure proof).");
} finally {
    app.definition.open = originalOpen;
    app.definition.onClose = originalClose;
    await app.close();
}
