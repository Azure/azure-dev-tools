import assert from "node:assert/strict";
import { createServer } from "node:http";
import { register } from "node:module";
import { chromium } from "playwright-core";

register("./host-loader.mjs", import.meta.url);
await import("../dist/extension.mjs");
const { registrations } = await import("./host-double.mjs");
const { app } = await import("../dist/toolkit.mjs");
assert.equal(registrations.length, 1);
const [canvas] = registrations[0].canvases;
const ctx = { instanceId: "azure-smoke", input: { mode: "fixture" } };
const invoke = (name, input = {}) => canvas.actions.find(action => action.name === name).handler({ ...ctx, input });
let browser;
let host;
try {
    const { url } = await canvas.open(ctx);
    const before = await invoke("get_state");
    assert.equal(before.model.mode, "fixture");
    assert.equal(before.model.profile, "uninitialized");
    assert.equal(before.model.scope, null);
    const filesBuild = await (await fetch(new URL("build.json", url))).json();
    assert.equal(before.build.id, filesBuild.id);
    host = createServer((_request, response) => {
        response.setHeader("Content-Type", "text/html");
        response.setHeader("Content-Security-Policy", `default-src 'none'; frame-src ${new URL(url).origin}; style-src 'unsafe-inline'`);
        response.end(`<iframe id="canvas" title="Azure starter smoke" sandbox="allow-scripts allow-same-origin" src="${url}" style="width:100%;height:700px"></iframe>`);
    });
    await new Promise(resolve => host.listen(0, "127.0.0.1", resolve));
    const hostOrigin = `http://127.0.0.1:${host.address().port}`;
    browser = await chromium.launch({
        headless: true,
        ...(process.env.CANVAS_BROWSER ? { executablePath: process.env.CANVAS_BROWSER } : { channel: "chrome" }),
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(7000);
    const errors = [];
    await page.route("**/*", route => {
        const target = new URL(route.request().url());
        if ([hostOrigin, new URL(url).origin].includes(target.origin)) return route.continue();
        errors.push("Unexpected external request: " + target.origin);
        return route.abort();
    });
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
        if (response.status() >= 400 && ["image", "script", "stylesheet"].includes(response.request().resourceType())) {
            errors.push("Asset failed: " + response.status());
        }
    });
    await page.goto(hostOrigin);
    const frame = page.frameLocator("#canvas");
    await frame.locator("#connection").getByText("Connected", { exact: true }).waitFor();
    const icons = frame.locator('img[src$="/icons/Subscription.svg"]');
    assert.equal(await icons.count(), 2);
    await icons.evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.equal(await icons.evaluateAll(images => images.every(image => image.naturalWidth > 0)), true);
    assert.match(await frame.locator("#build").textContent(), new RegExp(filesBuild.id));
    await frame.locator("#profile").click();
    await frame.locator("#scope").click();
    await frame.getByRole("radio").check();
    await frame.getByRole("button", { name: "Apply", exact: true }).click();
    await frame.locator("#list").click();
    await frame.locator("#status").getByText("3 resource groups loaded (synthetic).", { exact: true }).waitFor();
    assert.equal((await invoke("get_state")).model.rows.length, 3);
    await invoke("reload_profile");
    await frame.locator("#selection").getByText("No subscription selected.", { exact: true }).waitFor();
    assert.equal(await frame.locator("#rows li").count(), 0);
    await page.route(new URL("build.json", url).href, route => route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ ...filesBuild, id: "changed-files" }),
    }));
    await page.reload();
    await frame.locator("#error").getByText(
        "Files and provider builds differ. Reload the extension provider, then reopen this panel.",
        { exact: true },
    ).waitFor();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({
        passed: true, build: filesBuild.id, data: "synthetic",
        evidence: "Sandboxed browser + test SDK seam, not native-host or live-Azure authorization",
        checks: ["build identity", "both SVG icons decode", "explicit scope", "UI -> agent state", "agent -> UI state", "stale provider warning", "no external requests"],
    }));
} finally {
    try {
        await browser?.close();
    } finally {
        try {
            if (host) await new Promise(resolve => host.close(resolve));
        } finally {
            await app.close();
        }
    }
}
