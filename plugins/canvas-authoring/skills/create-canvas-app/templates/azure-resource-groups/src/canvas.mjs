import { enum_, InputError, obj, validate } from "@microsoft/canvas-toolkit/actions";
import { readFile } from "node:fs/promises";
import { startCanvasServer } from "@microsoft/canvas-toolkit/server";
import { canvasUiAssets } from "@microsoft/canvas-toolkit/ui";
import { contracts, createDomain } from "./domain.mjs";

const buildInfo = JSON.parse(await readFile(new URL("./build.json", import.meta.url), "utf8"));

export function createApp({ makeDomain = createDomain } = {}) {
    const entries = new Map();
    let stopped = false;
    const inputSchema = obj({ mode: enum_("fixture", "azure") });
    const dispatch = async (entry, name, input) => {
        try { return { ...await entry.domain.actions.dispatch(name, input), build: buildInfo }; }
        catch (error) {
            if (error instanceof InputError) error.statusCode = 400;
            throw error;
        }
    };
    const definition = {
        id: "__CANVAS_NAME__",
        displayName: "__CANVAS_NAME__",
        description: "Read-only Azure resource groups with explicit profile, subscription and query actions. Synthetic fixtures are opt-in.",
        inputSchema,
        actions: Object.entries(contracts).map(([name, contract]) => ({
            name, description: contract.description, inputSchema: contract.input,
            handler(ctx) {
                const entry = entries.get(ctx.instanceId);
                if (stopped || !entry) throw new InputError("Open the canvas before invoking actions.");
                return dispatch(entry, name, ctx.input);
            },
        })),
        async open(ctx) {
            validate(inputSchema, ctx.input ?? {});
            if (stopped) throw new Error("The canvas provider has stopped.");
            const mode = ctx.input?.mode ?? "azure";
            let entry = entries.get(ctx.instanceId);
            if (entry && entry.mode !== mode) throw new InputError("Use a separate panel to change between synthetic and Azure sources.");
            if (!entry) {
                entry = { mode, domain: makeDomain({ mode }) };
                const current = entry;
                entry.pending = startCanvasServer({
                    dispatch: (name, input) => dispatch(current, name, input),
                    model: () => ({ ...entry.domain.store.snapshot(), build: buildInfo }),
                    subscribe: entry.domain.store.subscribe,
                    maxBody: 4096,
                    assets: [
                        ["", new URL("./web/index.html", import.meta.url)],
                        ["app.js", new URL("./web/app.js", import.meta.url)],
                        ["app.css", new URL("./web/app.css", import.meta.url)],
                        ["build.json", new URL("./build.json", import.meta.url)],
                        ...canvasUiAssets,
                    ],
                });
                entries.set(ctx.instanceId, entry);
            }
            try {
                const server = await entry.pending;
                if (entries.get(ctx.instanceId) !== entry) throw new Error("The panel closed while opening.");
                return { title: mode === "fixture" ? "__CANVAS_NAME__ - synthetic demo" : "__CANVAS_NAME__ - Azure", url: server.url,
                    status: "Build " + buildInfo.id };
            } catch (error) {
                if (entries.get(ctx.instanceId) === entry) {
                    entries.delete(ctx.instanceId);
                    entry.domain.dispose();
                }
                throw error;
            }
        },
        async onClose(ctx) {
            const entry = entries.get(ctx.instanceId);
            if (!entry) return;
            entries.delete(ctx.instanceId);
            entry.domain.dispose();
            await (await entry.pending).close();
        },
    };
    return { definition, async close() {
        stopped = true;
        const results = await Promise.allSettled([...entries.keys()].map(instanceId => definition.onClose({ instanceId })));
        const failures = results.filter(result => result.status === "rejected").map(result => result.reason);
        if (failures.length) throw new AggregateError(failures, "Canvas teardown failed.");
    } };
}
