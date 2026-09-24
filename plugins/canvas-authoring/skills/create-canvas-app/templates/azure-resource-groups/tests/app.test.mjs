import assert from "node:assert/strict";
import { test } from "node:test";
import { createDomain } from "../src/domain.mjs";
import { createFixture, selection } from "../src/fixture.mjs";
import { createApp } from "../dist/canvas.mjs";

async function domain(t, options = {}) {
    const fixture = createFixture(options);
    const app = createDomain({ mode: "fixture", fixture });
    t.after(() => app.dispose());
    const invoke = (name, input = {}) => app.actions.dispatch(name, input);
    return { fixture, app, invoke, async select() {
        await invoke("reload_profile");
        await invoke("select_subscription", selection);
    } };
}

test("no resource read before explicit load, scope selection and action; strict inputs and projection", async t => {
    const { fixture, invoke, select } = await domain(t);
    assert.equal(fixture.stats.requests, 0);
    assert.equal((await invoke("get_state")).model.profile, "uninitialized");
    await assert.rejects(invoke("list_resource_groups"), { code: "invalid_input" });
    await select();
    assert.equal(fixture.stats.requests, 0);
    for (const input of [{ extra: true }, { subscriptionId: "bad" }]) {
        await assert.rejects(invoke("list_resource_groups", input), { code: "invalid_input" });
    }
    await assert.rejects(invoke("select_subscription", { ...selection, subscriptionId: "33333333-3333-3333-3333-333333333333" }));
    const result = await invoke("list_resource_groups");
    assert.equal(fixture.stats.requests, 1);
    assert.equal(result.model.status, "complete");
    assert.equal(result.model.rows.length, 3);
    for (const row of result.model.rows) assert.deepEqual(Object.keys(row).sort(), ["id", "location", "name"]);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-not-a-real-credential|omitted/);
});

test("empty success and permission failure remain distinct", async t => {
    for (const scenario of ["empty", "error"]) {
        const { invoke, select } = await domain(t, { scenario });
        await select();
        if (scenario === "error") {
            await assert.rejects(invoke("list_resource_groups"));
            const state = (await invoke("get_state")).model;
            assert.equal(state.status, "error");
            assert.ok(state.error.message);
            assert.deepEqual(state.rows, []);
        } else {
            const state = (await invoke("list_resource_groups")).model;
            assert.equal(state.status, "complete");
            assert.equal(state.error, null);
            assert.deepEqual(state.rows, []);
        }
    }
});

test("cancellation, reselection and profile reload reject stale completions", async t => {
    for (const action of ["cancel", "select_subscription", "reload_profile"]) {
        const { invoke, select } = await domain(t, { delayMs: 150 });
        await select();
        const reading = invoke("list_resource_groups");
        const rejected = assert.rejects(reading, { code: "request-cancelled" });
        await invoke(action, action === "select_subscription" ? selection : {});
        await rejected;
        const state = (await invoke("get_state")).model;
        assert.deepEqual(state.rows, []);
        assert.equal(state.status, action === "cancel" ? "cancelled" : action === "select_subscription" ? "ready-to-read" : "select-subscription");
    }
});

test("a late transport that ignores cancellation cannot publish stale rows", async t => {
    let finish;
    const started = Promise.withResolvers();
    const fixture = createFixture({ delayMs: 0 });
    const send = fixture.httpClient.sendRequest;
    fixture.httpClient.sendRequest = request => new Promise((resolve, reject) => {
        finish = () => send({ ...request, abortSignal: undefined }).then(resolve, reject);
        started.resolve();
    });
    const app = createDomain({ mode: "fixture", fixture });
    t.after(() => app.dispose());
    await app.actions.dispatch("reload_profile", {});
    await app.actions.dispatch("select_subscription", selection);
    const reading = app.actions.dispatch("list_resource_groups", {});
    const rejected = assert.rejects(reading, { code: "request-cancelled" });
    await started.promise;
    await app.actions.dispatch("cancel", {});
    await finish();
    await rejected;
    assert.equal(app.store.model().status, "cancelled");
    assert.deepEqual(app.store.model().rows, []);
});

test("disposal cancels requests, invalidates contexts and rejects later actions", async t => {
    const { app, invoke, select } = await domain(t, { delayMs: 150 });
    await select();
    const reading = invoke("list_resource_groups");
    const rejected = assert.rejects(reading, { code: "request-cancelled" });
    app.dispose();
    await rejected;
    await assert.rejects(invoke("get_state"), { code: "disposed" });
});

test("emitted artifact isolates panels, handles reopen/close and enforces HTTP boundaries", async t => {
    const app = createApp();
    t.after(() => app.close());
    const ctx = { instanceId: "first", input: { mode: "fixture" } };
    const [opened, reopened] = await Promise.all([app.definition.open(ctx), app.definition.open(ctx)]);
    assert.equal(opened.url, reopened.url);
    const invoke = (name, input = {}, instanceId = "first") => app.definition.actions.find(action => action.name === name).handler({ instanceId, input });
    const other = await app.definition.open({ instanceId: "second", input: {} });
    const live = await app.definition.open({ instanceId: "live", input: { mode: "azure" } });
    assert.equal((await invoke("get_state", {}, "live")).model.profile, "uninitialized");
    assert.equal((await invoke("get_state", {}, "live")).model.mode, "azure");
    await assert.rejects(app.definition.open({ ...ctx, input: { mode: "azure" } }), { code: "invalid_input" });
    await invoke("reload_profile");
    await invoke("select_subscription", selection);
    const origin = new URL(opened.url).origin;
    const post = (input, caller = origin) => fetch(new URL("api/action", opened.url), {
        method: "POST", headers: { Origin: caller, "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    const posted = await post({ name: "list_resource_groups", input: {} });
    assert.equal(posted.status, 200);
    assert.equal((await posted.json()).model.rows.length, 3);
    assert.equal((await invoke("get_state")).model.rows.length, 3);
    assert.equal((await invoke("get_state", {}, "second")).model.profile, "uninitialized");
    assert.equal((await post({ name: "get_state", input: {} }, "https://example.invalid")).status, 403);
    assert.equal((await post({ name: "list_resource_groups", input: { unexpected: true } })).status, 400);
    assert.equal((await post({ name: "get_state", input: { huge: "x".repeat(5000) } })).status, 413);
    for (const asset of ["", "app.js", "app.css"]) {
        const response = await fetch(new URL(asset, opened.url));
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
    }
    assert.equal((await fetch(new URL("not-allowlisted", opened.url))).status, 404);
    const svg = await fetch(new URL("icons/Subscription.svg", opened.url));
    assert.equal(svg.status, 200);
    assert.equal(svg.headers.get("content-type"), "image/svg+xml");
    assert.match(await svg.text(), /<svg/);
    assert.equal((await fetch(new URL("/icons/Subscription.svg", opened.url))).status, 404);
    const picker = await fetch(new URL("canvas-ui/subscription-picker.mjs", opened.url));
    assert.equal(picker.status, 200);
    assert.match(await picker.text(), /\.\.\/icons\/Subscription\.svg/);
    await app.definition.onClose(ctx);
    await assert.rejects(fetch(opened.url));
    assert.equal((await fetch(other.url)).status, 200);
    const fresh = await app.definition.open(ctx);
    assert.equal((await invoke("get_state")).model.profile, "uninitialized");
    await app.close();
    for (const url of [fresh.url, other.url, live.url]) await assert.rejects(fetch(url));
});
