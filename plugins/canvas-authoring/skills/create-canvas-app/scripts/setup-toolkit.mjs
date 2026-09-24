#!/usr/bin/env node
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const HELP = `Generate toolkit modules/build around a host-owned entry (Node >=22).

For canvas authoring, invoke the GitHub Copilot app's installed create-canvas
skill first. It is the source of truth. At its customization step, pass the
native extension.mjs to this command. The input is copied unchanged, never
modified. Connect its declaration with attachToolkit as directed in the generated
README. npm run build checks actual registration and fails until connected.

Usage:
  node setup-toolkit.mjs --name my-canvas --scaffold /native/my-canvas/extension.mjs \\
    --output /existing/parent/new-app \\
    --toolkit-version "$TOOLKIT_VERSION"

Options:
  --name             Lowercase kebab-case name, 1-64 characters.
  --scaffold         Host-owned extension.mjs in a directory containing only that file.
  --output           New directory; parent must exist. Never overwritten.
  --toolkit-version  Exact published toolkit version; no tags or ranges.
  --toolkit-tarball  Alternative trusted local npm-pack archive, including prereleases.
  --template          counter (default) or azure-resource-groups. Azure needs the full installed plugin.
  --help             Show this help without creating files.

No install, login, publication, activation, or global configuration changes.
Every output destination must be new; reruns always refuse, including identical
outputs. All input/collision checks precede writes. No arbitrary source rewriting.
Choose exactly one toolkit source. Set TOOLKIT_VERSION to an approved compatible
published version. Registry mode pins package.json without network I/O;
npm install resolves it later and must succeed before building. Both modes need
the public /build export. Local archives are copied, not linked to their source.
`;

function isPinnedVersion(version) {
    return typeof version === "string" && version.length <= 128
        && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version);
}

function parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const key = args[i];
        if (!["--name", "--scaffold", "--output", "--toolkit-tarball", "--toolkit-version", "--template"].includes(key)) {
            throw new Error("Unknown option: " + key);
        }
        if (Object.hasOwn(options, key)) throw new Error("Duplicate option: " + key);
        const value = args[++i];
        if (!value || value.startsWith("--") || /[\x00-\x1f\x7f]/.test(value)) {
            throw new Error("Expected a non-empty value without control characters for " + key);
        }
        options[key] = value;
    }
    for (const key of ["--name", "--scaffold", "--output"]) {
        if (!options[key]) throw new Error("Required option: " + key);
    }
    if (Boolean(options["--toolkit-version"]) === Boolean(options["--toolkit-tarball"])) {
        throw new Error("Provide exactly one of --toolkit-version or --toolkit-tarball.");
    }
    if (options["--toolkit-version"] && !isPinnedVersion(options["--toolkit-version"])) {
        throw new Error("--toolkit-version requires an exact SemVer version, not a tag, range, URL, or path.");
    }
    return options;
}

// Inspect npm's tar header/manifest without extracting or executing its contents.
function toolkitManifest(archive) {
    const tar = gunzipSync(archive, { maxOutputLength: 64 * 1024 * 1024 });
    let manifest;
    let offset = 0;
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512);
        if (header.every(byte => byte === 0)) break;
        const text = (start, length) => header.subarray(start, start + length).toString("utf8").replace(/\0.*$/s, "");
        const sizeText = text(124, 12).trim();
        if (!/^[0-7]+$/.test(sizeText)) throw new Error("Invalid tar entry size.");
        const size = Number.parseInt(sizeText, 8);
        const checksum = [...header].reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0);
        if (checksum !== Number.parseInt(text(148, 8).trim(), 8)) throw new Error("Invalid tar header checksum.");
        const start = offset + 512;
        if (!Number.isSafeInteger(size) || start + size > tar.length) throw new Error("Truncated toolkit archive.");
        const name = [text(345, 155), text(0, 100)].filter(Boolean).join("/");
        if (name === "package/package.json") {
            if (manifest || !["", "0"].includes(text(156, 1)) || size > 1024 * 1024) {
                throw new Error("Expected one regular package/package.json.");
            }
            manifest = JSON.parse(tar.subarray(start, start + size).toString("utf8"));
        }
        offset = start + Math.ceil(size / 512) * 512;
    }
    if (manifest?.name !== "@microsoft/canvas-toolkit" || !isPinnedVersion(manifest.version)) {
        throw new Error("Expected an npm-pack archive of @microsoft/canvas-toolkit with an exact SemVer version.");
    }
    if (!manifest.exports?.["./build"]) {
        throw new Error("This starter requires a toolkit candidate with the public /build export. Supply an updated approved tarball.");
    }
}

async function safePath(value) {
    if (value.split(/[/\\]/).some(part => part === "..")) throw new Error("Path must not contain '..' path segments.");
    const absolute = path.resolve(value);
    let current = path.parse(absolute).root;
    for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
        current = path.join(current, part);
        if ((await lstat(current)).isSymbolicLink()) throw new Error("Symlink paths are not supported: " + current);
    }
    return absolute;
}

export async function scaffold(args) {
    const options = parseArgs(args);
    const name = options["--name"];
    const preset = options["--template"] ?? "counter";
    if (!["counter", "azure-resource-groups"].includes(preset)) throw new Error("Unknown template: " + preset);
    if (name.length > 64 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)
        || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(name)) {
        throw new Error("Invalid name: use 1-64 lowercase kebab-case characters, starting with a letter; no device names.");
    }
    const output = options["--output"];
    if (output.split(/[/\\]/).some(part => part === "..")) throw new Error("Output must not contain '..' path segments.");
    const requested = path.resolve(output);
    const parent = await safePath(path.dirname(requested));
    const destination = path.join(parent, path.basename(requested));
    try {
        await lstat(destination);
        throw new Error("Destination already exists; refusing to overwrite: " + destination);
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
    const native = await safePath(options["--scaffold"]);
    if (path.basename(native) !== "extension.mjs" || !(await lstat(native)).isFile()) {
        throw new Error("--scaffold must name a regular extension.mjs file.");
    }
    const nativeFiles = await readdir(path.dirname(native));
    if (nativeFiles.length !== 1 || nativeFiles[0] !== "extension.mjs") {
        throw new Error("Scaffold directory must contain only extension.mjs; existing package, lockfile, or customized project is not supported.");
    }
    if ((await lstat(native)).size > 1024 * 1024) throw new Error("Host entry exceeds 1 MiB.");
    const nativeBytes = await readFile(native);
    if (!nativeBytes.length || nativeBytes.includes(0)) throw new Error("Host entry must be non-empty JavaScript text.");
    let archive;
    if (options["--toolkit-tarball"]) {
        const tarball = await safePath(options["--toolkit-tarball"]);
        const stat = await lstat(tarball);
        if (!stat.isFile() || stat.size > 32 * 1024 * 1024 || !tarball.endsWith(".tgz")) {
            throw new Error("Toolkit must be a regular .tgz file no larger than 32 MiB.");
        }
        archive = await readFile(tarball);
        toolkitManifest(archive);
    }
    const sources = { ...template };
    if (preset === "azure-resource-groups") {
        for (const file of [
            "package.json", "README.md", "src/domain.mjs", "src/canvas.mjs", "src/fixture.mjs",
            "src/browser/app.mjs", "src/browser/app.css", "src/browser/index.html",
            "scripts/check-entry.mjs", "scripts/smoke.mjs", "tests/app.test.mjs",
        ]) {
            const source = await safePath(fileURLToPath(new URL("../templates/azure-resource-groups/" + file, import.meta.url)));
            if (!(await lstat(source)).isFile()) throw new Error("Expected a regular template file: " + file);
            sources[file] = await readFile(source, "utf8");
        }
        const reader = await safePath(fileURLToPath(new URL("../references/toolkit/examples/resource-groups.mjs", import.meta.url)));
        sources["src/resource-groups.mjs"] = await readFile(reader, "utf8");
    }
    const files = new Map(Object.entries(sources).map(([file, content]) => [
        file, Buffer.from(content.replaceAll("__CANVAS_NAME__", name).replaceAll("__CANVAS_TEMPLATE__", preset).trimStart()),
    ]));
    const manifest = JSON.parse(files.get("package.json").toString("utf8"));
    if (options["--toolkit-version"]) manifest.dependencies["@microsoft/canvas-toolkit"] = options["--toolkit-version"];
    files.set("package.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
    files.set("src/extension.mjs", nativeBytes);
    if (archive) files.set("vendor/canvas-toolkit.tgz", archive);
    // Exclusive creation also refuses a destination created after the first check.
    await mkdir(destination);
    try {
        for (const [file, content] of files) {
            const target = path.join(destination, file);
            await mkdir(path.dirname(target), { recursive: true });
            await writeFile(target, content, { flag: "wx" });
        }
    } catch (error) {
        throw new Error("Scaffold failed; inspect the partial directory before removing or retrying: " + destination, { cause: error });
    }
    return destination;
}

const template = {
    "package.json": String.raw`{
  "name": "__CANVAS_NAME__",
  "version": "0.1.0",
  "canvasTemplate": "__CANVAS_TEMPLATE__",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "node scripts/build.mjs",
    "check": "node scripts/check.mjs",
    "test": "node --test tests/app.test.mjs"
  },
  "dependencies": {
    "@microsoft/canvas-toolkit": "file:vendor/canvas-toolkit.tgz"
  },
  "devDependencies": {
    "esbuild": "0.28.2"
  }
}
`,
    ".gitignore": String.raw`node_modules/
dist/
vendor/*.tgz
*.log
`,
    "src/domain.mjs": String.raw`import { defineActions, empty, int, obj, validate } from "@microsoft/canvas-toolkit/actions";
import { createViewStore } from "@microsoft/canvas-toolkit/state";

export function createDomain() {
    const store = createViewStore({ initial: { count: 0 } });
    const actions = defineActions({
        get_state: {
            description: "Read the shared counter.",
            input: empty(),
            run: () => store.snapshot(),
        },
        increment: {
            description: "Increase the shared counter by 1 to 10, up to 1000.",
            input: obj({ amount: int({ min: 1, max: 10 }) }, { required: ["amount"] }),
            effect: "write",
            run: ({ amount }) => {
                const count = store.model().count + amount;
                validate(int({ min: 0, max: 1000 }), count, "count");
                store.patch({ count });
                return store.snapshot();
            },
        },
        reset: {
            description: "Reset the shared counter to zero.",
            input: empty(),
            effect: "write",
            run: () => {
                store.patch({ count: 0 });
                return store.snapshot();
            },
        },
    });
    return { store, actions };
}
`,
    "src/canvas.mjs": String.raw`import { empty, InputError, validate } from "@microsoft/canvas-toolkit/actions";
import { readFile } from "node:fs/promises";
import { startCanvasServer } from "@microsoft/canvas-toolkit/server";
import { canvasUiAssets } from "@microsoft/canvas-toolkit/ui";
import { createDomain } from "./domain.mjs";

const buildInfo = JSON.parse(await readFile(new URL("./build.json", import.meta.url), "utf8"));

export function createApp() {
    const { store, actions } = createDomain();
    const servers = new Map();
    let stopped = false;
    const dispatch = async (name, input) => {
        try {
            return { ...await actions.dispatch(name, input), build: buildInfo };
        } catch (error) {
            if (error instanceof InputError) error.statusCode = 400;
            throw error;
        }
    };
    const definition = {
        id: "__CANVAS_NAME__",
        displayName: "__CANVAS_NAME__",
        description: "A shared, ephemeral counter controlled by you and the agent.",
        inputSchema: empty(),
        actions: actions.names.map(name => ({
            name,
            description: actions.description(name),
            inputSchema: actions.schema(name),
            handler: ctx => {
                if (stopped || !servers.has(ctx.instanceId)) throw new Error("Open the canvas before invoking actions.");
                return dispatch(name, ctx.input);
            },
        })),
        async open(ctx) {
            validate(empty(), ctx.input ?? {});
            if (stopped) throw new Error("The canvas provider has stopped.");
            let pending = servers.get(ctx.instanceId);
            if (!pending) {
                pending = startCanvasServer({
                    dispatch,
                    model: () => ({ ...store.snapshot(), build: buildInfo }),
                    subscribe: store.subscribe,
                    maxBody: 4096,
                    assets: [
                        ["", new URL("./web/index.html", import.meta.url)],
                        ["app.js", new URL("./web/app.js", import.meta.url)],
                        ["app.css", new URL("./web/app.css", import.meta.url)],
                        ["build.json", new URL("./build.json", import.meta.url)],
                        ...canvasUiAssets,
                    ],
                });
                servers.set(ctx.instanceId, pending);
            }
            try {
                return { title: "__CANVAS_NAME__", url: (await pending).url };
            } catch (error) {
                if (servers.get(ctx.instanceId) === pending) servers.delete(ctx.instanceId);
                throw error;
            }
        },
        async onClose(ctx) {
            const pending = servers.get(ctx.instanceId);
            if (pending) {
                servers.delete(ctx.instanceId);
                await (await pending).close();
            }
        },
    };
    return {
        definition,
        async close() {
            stopped = true;
            const pending = [...servers.values()];
            servers.clear();
            const results = await Promise.allSettled(pending.map(async server => (await server).close()));
            const failures = results.filter(result => result.status === "rejected").map(result => result.reason);
            if (failures.length) throw new AggregateError(failures, "Canvas teardown failed.");
        },
    };
}
`,
    "src/toolkit.mjs": String.raw`import { CanvasError } from "@github/copilot-sdk/extension";
import { createApp } from "./canvas.mjs";

export const app = createApp();
let attached = false;
export function attachToolkit(native) {
    if (attached) throw new Error("This demo supports one toolkit canvas declaration.");
    if (!native || native.id !== "__CANVAS_NAME__" || typeof native.open !== "function"
        || typeof native.onClose !== "function" || !Array.isArray(native.actions)) {
        throw new Error("Expected the host-owned __CANVAS_NAME__ declaration with actions, open, and onClose.");
    }
    for (const signal of ["SIGTERM", "SIGINT", "disconnect"]) {
        if (process.listenerCount(signal)) {
            throw new Error("Existing " + signal + " handler: custom shutdown ownership requires host-guided integration.");
        }
    }
    attached = true;
    for (const [signal, handler] of shutdownHandlers) process.once(signal, handler);
    return {
        ...native,
        inputSchema: app.definition.inputSchema,
        actions: app.definition.actions.map(action => ({
            ...action,
            async handler(ctx) {
                try {
                    return await action.handler(ctx);
                } catch (error) {
                    throw new CanvasError(error.code ?? "action_failed", error.message);
                }
            },
        })),
        open: ctx => app.definition.open(ctx),
        async onClose(ctx) {
            try {
                await app.definition.onClose(ctx);
            } finally {
                await native.onClose(ctx);
            }
        },
    };
}

let stopping;
function stop(code) {
    stopping ??= app.close().then(() => process.exit(code), error => {
        console.error(error);
        process.exit(1);
    });
}
const shutdownHandlers = new Map([
    ["SIGTERM", () => stop(0)], ["SIGINT", () => stop(0)], ["disconnect", () => stop(0)],
]);
export function assertShutdownOwnership() {
    for (const [signal, handler] of shutdownHandlers) {
        const listeners = process.listeners(signal);
        if (listeners.length !== 1 || listeners[0] !== handler) {
            throw new Error("Conflicting " + signal + " handlers: integrate shutdown ownership explicitly before activation.");
        }
    }
}
`,
    "src/browser/index.html": String.raw`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>__CANVAS_NAME__</title>
    <link rel="stylesheet" href="./app.css">
    <script type="module" src="./app.js"></script>
</head>
<body class="canvas-ui">
    <main>
        <h1>__CANVAS_NAME__</h1>
        <p>You and the agent share this counter. Provider restart resets it.</p>
        <p class="counter" aria-live="polite">Count: <output id="count">0</output></p>
        <div class="controls">
            <button id="increment" class="primary-button" disabled>Add one</button>
            <button id="reset" class="secondary-button" disabled>Reset</button>
        </div>
        <p id="error" role="alert" hidden></p>
        <p id="connection" role="status">Connecting...</p>
        <p id="build">Build loading...</p>
    </main>
</body>
</html>
`,
    "src/browser/app.mjs": String.raw`import "@microsoft/canvas-toolkit/ui/styles.css";
import "./app.css";

const count = document.querySelector("#count");
const errorBox = document.querySelector("#error");
const connection = document.querySelector("#connection");
const increment = document.querySelector("#increment");
const reset = document.querySelector("#reset");
let version = -1;
let busy = false;
let currentCount = 0;
let fileBuild;

function controls() {
    increment.disabled = busy || version < 0 || currentCount >= 1000;
    reset.disabled = busy || version < 0;
}
function showError(error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
}
function render(snapshot) {
    if (snapshot.version < version) return;
    version = snapshot.version;
    currentCount = snapshot.model.count;
    count.textContent = String(currentCount);
    document.querySelector("#build").textContent = "Provider build: " + snapshot.build.id;
    if (fileBuild && fileBuild.id !== snapshot.build.id) {
        showError(new Error("Files and provider builds differ. Reload the extension provider, then reopen this panel."));
    }
    controls();
}
async function request(route, options) {
    const response = await fetch(new URL(route, location.href), options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Request failed: " + response.status);
    return result;
}
async function refresh() {
    try {
        render(await request("api/state"));
    } catch (error) {
        showError(error);
    }
}
async function act(name, input) {
    busy = true;
    controls();
    errorBox.hidden = true;
    try {
        render(await request("api/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, input }),
        }));
    } catch (error) {
        showError(error);
    } finally {
        busy = false;
        controls();
    }
}
increment.addEventListener("click", () => act("increment", { amount: 1 }));
reset.addEventListener("click", () => act("reset", {}));
const events = new EventSource(new URL("events", location.href));
events.addEventListener("change", refresh);
events.onopen = () => { connection.textContent = "Connected"; };
events.onerror = () => { connection.textContent = "Connection lost; reconnecting..."; };
window.addEventListener("pagehide", () => events.close());
try {
    fileBuild = await request("build.json");
    await refresh();
} catch (error) {
    showError(error);
}
`,
    "src/browser/app.css": String.raw`main { max-width: 42rem; margin: 0 auto; padding: 24px; }
h1 { font-size: var(--text-title-large, 26px); line-height: var(--leading-title-large, 32px); }
p { color: var(--canvas-muted); }
.counter { color: var(--canvas-fg); font-size: 24px; }
.controls { display: flex; gap: 8px; flex-wrap: wrap; }
#error { color: var(--canvas-danger); }
`,
    "scripts/build.mjs": String.raw`import { build } from "esbuild";
import { createHash } from "node:crypto";
import { isBuiltin } from "node:module";
import { copyFile, lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareCanvasUiAssets } from "@microsoft/canvas-toolkit/build";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
try {
    const stat = await lstat(output);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("dist must be a regular directory.");
} catch (error) {
    if (error.code !== "ENOENT") throw error;
}
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "web"), { recursive: true });
const host = "@github/copilot-sdk/extension";
const ui = await prepareCanvasUiAssets(output);
const uiModule = ui.nodeImport.path;
const browserExternals = new Set(Object.values(ui.browserImports));
const common = {
    absWorkingDir: root,
    bundle: true,
    format: "esm",
    metafile: true,
    logLevel: "warning",
    legalComments: "eof",
};
const node = {
    ...common,
    platform: "node",
    target: "node22",
    banner: { js: 'import { createRequire as __createRequire } from "node:module";\nconst require = __createRequire(import.meta.url);' },
    plugins: [{
        name: "toolkit-asset-module",
        setup(api) {
            api.onResolve({ filter: /^@microsoft\/canvas-toolkit\/ui$/ }, () => ({ path: uiModule, external: true }));
        },
    }],
};
const results = await Promise.all([
    build({ ...node, entryPoints: ["src/extension.mjs"], outfile: "dist/extension.mjs", external: [host, "./toolkit.mjs"] }),
    build({ ...node, entryPoints: ["src/toolkit.mjs"], outfile: "dist/toolkit.mjs", external: [host, "./canvas.mjs"] }),
    build({ ...node, entryPoints: ["src/canvas.mjs"], outfile: "dist/canvas.mjs", external: [host] }),
    build({
        ...common, platform: "browser", target: "es2022", entryPoints: ["src/browser/app.mjs"], outfile: "dist/web/app.js",
        plugins: [{
            name: "toolkit-browser-assets",
            setup(api) {
                api.onResolve({ filter: /^@microsoft\/canvas-toolkit\/ui\// }, args => {
                    const route = ui.browserImports[args.path];
                    return route ? { path: route, external: true } : undefined;
                });
            },
        }],
    }),
]);
for (const [index, result] of results.entries()) {
    for (const artifact of Object.values(result.metafile.outputs)) {
        for (const imported of artifact.imports) {
            if (!imported.external) continue;
            const allowed = (index === 3 && browserExternals.has(imported.path)) || (index < 3 && (isBuiltin(imported.path)
                || (index < 2 && imported.path === host)
                || (index === 0 && imported.path === "./toolkit.mjs")
                || (index === 1 && imported.path === "./canvas.mjs")
                || imported.path === uiModule));
            if (!allowed) throw new Error("Unexpected runtime dependency: " + imported.path);
        }
    }
}
await copyFile(path.join(root, "src/browser/index.html"), path.join(output, "web/index.html"));
async function artifactFiles(directory, prefix = "") {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const relative = prefix + entry.name;
        if (entry.isDirectory()) files.push(...await artifactFiles(path.join(directory, entry.name), relative + "/"));
        else if (entry.isFile()) files.push(relative);
        else throw new Error("Unexpected emitted asset: " + relative);
    }
    return files.sort();
}
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const identity = { name: pkg.name, version: pkg.version, template: pkg.canvasTemplate };
const digest = createHash("sha256").update(JSON.stringify(identity) + "\0");
for (const file of await artifactFiles(output)) {
    digest.update(file + "\0").update(await readFile(path.join(output, file)));
}
await writeFile(path.join(output, "build.json"), JSON.stringify({
    id: digest.digest("hex").slice(0, 12), ...identity,
}) + "\n");
try {
    const { stdout } = await promisify(execFile)(process.execPath, ["scripts/check.mjs"], { cwd: root, timeout: 20000 });
    process.stdout.write(stdout + "Built dist. Reload the extension provider, then reopen its panel; a panel refresh alone does not reload provider code.\n");
} catch (error) {
    throw new Error("Toolkit registration check failed; do not activate dist. Connect the host entry using README.md.\n" + (error.stderr ?? error.message));
}
`,
    "scripts/host-loader.mjs": String.raw`// Test-only SDK seam. Never part of dist or a substitute for the native host.
export function resolve(specifier, context, nextResolve) {
    if (specifier === "@github/copilot-sdk/extension") {
        return { url: new URL("./host-double.mjs", import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
}
`,
    "scripts/host-double.mjs": String.raw`// Captures actual emitted-entry registration without a native host session.
export const registrations = [];
const constructed = new WeakSet();
export class CanvasError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}
export function createCanvas(definition) {
    constructed.add(definition);
    return definition;
}
export async function joinSession(options) {
    if (!Array.isArray(options?.canvases) || options.canvases.some(canvas => !constructed.has(canvas))) {
        throw new Error("Every registered canvas must be constructed through SDK createCanvas.");
    }
    registrations.push(options);
    return { sessionId: "toolkit-check", workspacePath: process.cwd() };
}
`,
    "scripts/check.mjs": String.raw`import { register } from "node:module";
register("./host-loader.mjs", import.meta.url);
await import("./check-entry.mjs");
`,
    "scripts/check-entry.mjs": String.raw`import assert from "node:assert/strict";
import { registrations } from "./host-double.mjs";
import { app, assertShutdownOwnership } from "../dist/toolkit.mjs";
import { canvasUiAssets } from "../dist/assets/toolkit/ui.mjs";

// Import the emitted HOST entry, not a parallel toolkit test provider.
await import("../dist/extension.mjs");
assertShutdownOwnership();
assert.equal(registrations.length, 1, "Expected one host joinSession registration.");
const canvases = registrations[0].canvases;
assert.equal(canvases?.length, 1, "Expected one canvas in the host registration.");
export const canvas = canvases[0];
assert.equal(canvas.id, "__CANVAS_NAME__");
assert.deepEqual(canvas.actions.map(action => action.name), ["get_state", "increment", "reset"],
    "Host entry is not connected. Import attachToolkit and wrap its native createCanvas declaration.");

const ctx = { sessionId: "toolkit-check", extensionId: "test:__CANVAS_NAME__",
    canvasId: "__CANVAS_NAME__", instanceId: "check-panel", input: {},
    host: { capabilities: { "canvas-renderer": true } } };
const originalOpen = app.definition.open;
const originalClose = app.definition.onClose;
const increment = app.definition.actions.find(action => action.name === "increment");
const originalIncrement = increment.handler;
let openContext;
let closeContext;
let actionContext;
app.definition.open = input => { openContext = input; return originalOpen(input); };
app.definition.onClose = input => { closeContext = input; return originalClose(input); };
increment.handler = input => { actionContext = input; return originalIncrement(input); };
try {
    const invoke = (name, input) => canvas.actions.find(action => action.name === name).handler({ ...ctx, input });
    const { url } = await canvas.open(ctx);
    assert.equal(openContext, ctx, "Host open context was not forwarded intact.");
    assert.equal((await fetch(url)).status, 200);
    for (const [route, [, mime]] of canvasUiAssets) {
        const response = await fetch(new URL(route, url));
        assert.equal(response.status, 200, "Missing toolkit asset: " + route);
        assert.equal(response.headers.get("content-type"), mime, route);
        assert.ok((await response.arrayBuffer()).byteLength > 0, route);
    }
    assert.equal((await invoke("increment", { amount: 2 })).model.count, 2);
    assert.equal(actionContext.host, ctx.host, "Host action context was not forwarded intact.");
    assert.equal(actionContext.instanceId, ctx.instanceId);
    assert.equal((await (await fetch(new URL("api/state", url))).json()).model.count, 2);
    await assert.rejects(invoke("increment", { amount: "1" }), { code: "invalid_input" });
    assert.equal((await invoke("reset", {})).model.count, 0);
    await canvas.onClose(ctx);
    assert.equal(closeContext, ctx, "Host close context was not forwarded intact.");
    await assert.rejects(fetch(url));
    console.log("Toolkit registration ready (test SDK seam, not native-host activation).");
} finally {
    app.definition.open = originalOpen;
    app.definition.onClose = originalClose;
    increment.handler = originalIncrement;
    await app.close();
}
`,
    "tests/app.test.mjs": String.raw`import assert from "node:assert/strict";
import { test } from "node:test";
import { createDomain } from "../src/domain.mjs";
import { createApp } from "../dist/canvas.mjs";

test("strict shared actions and counter bounds", async () => {
    const { actions, store } = createDomain();
    assert.deepEqual(await actions.dispatch("increment", { amount: 2 }), { version: 1, model: { count: 2 } });
    for (const input of [{ amount: 0 }, { amount: 11 }, { amount: "1" }, { amount: 1, extra: true }]) {
        await assert.rejects(actions.dispatch("increment", input), { code: "invalid_input" });
    }
    await assert.rejects(actions.dispatch("unknown", {}), { code: "invalid_input" });
    store.patch({ count: 1000 });
    await assert.rejects(actions.dispatch("increment", { amount: 1 }), { code: "invalid_input" });
    assert.equal(store.model().count, 1000);
    assert.equal((await actions.dispatch("reset", {})).model.count, 0);
});

test("built canvas shares UI/agent state and closes its servers", async t => {
    const app = createApp();
    t.after(() => app.close());
    const ctx = { instanceId: "test-panel", input: {} };
    const [opened, reopened] = await Promise.all([app.definition.open(ctx), app.definition.open(ctx)]);
    assert.equal(opened.url, reopened.url);
    const origin = new URL(opened.url).origin;
    assert.equal(new URL(opened.url).hostname, "127.0.0.1");
    const page = await fetch(opened.url);
    assert.match(page.headers.get("content-security-policy"), /script-src 'self'/);
    assert.match(await page.text(), /app.css/);
    for (const [route, type, marker] of [
        ["canvas-ui/azure-subscription-picker.mjs", "text/javascript", "createAzureSubscriptionPicker"],
        ["canvas-ui/subscription-picker.mjs", "text/javascript", "../icons/Subscription.svg"],
        ["icons/Subscription.svg", "image/svg+xml", "<svg"],
    ]) {
        const asset = await fetch(new URL(route, opened.url));
        assert.equal(asset.status, 200, route);
        assert.ok(asset.headers.get("content-type").startsWith(type), route);
        assert.ok((await asset.text()).includes(marker), route);
    }
    assert.equal((await fetch(new URL("/icons/Subscription.svg", opened.url))).status, 404);
    const action = app.definition.actions.find(item => item.name === "increment");
    await action.handler({ ...ctx, input: { amount: 3 } });
    const posted = await fetch(new URL("api/action", opened.url), {
        method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "increment", input: { amount: 1 } }),
    });
    assert.equal(posted.status, 200);
    assert.equal((await posted.json()).model.count, 4);
    const other = await app.definition.open({ instanceId: "other-panel", input: {} });
    assert.equal((await (await fetch(new URL("api/state", other.url))).json()).model.count, 4);
    await app.definition.onClose(ctx);
    await assert.rejects(fetch(opened.url));
    await app.definition.onClose(ctx);
    assert.equal((await fetch(other.url)).status, 200);
    await app.close();
    await assert.rejects(fetch(other.url));
    await assert.rejects(app.definition.open(ctx), /stopped/);
});
`,
    "README.md": String.raw`# __CANVAS_NAME__

A counter shared by the UI and agent. All panels in one provider share the
count; browser reload keeps it and provider restart resets it.

## Connect the host entry

Use the installed create-canvas skill to connect the copied src/extension.mjs
to its native scaffold. The host skill owns registration, lifecycle and
activation. If it is missing, use a host that provides it. Add:

    import { attachToolkit } from "./toolkit.mjs";

Wrap the existing declaration as createCanvas(attachToolkit(nativeOptions)).
Keep its metadata, full context and surrounding session wiring. The adapter
replaces demo callbacks and runs native close after toolkit cleanup. Customized
callbacks or competing shutdown handlers need explicit integration.
The original scaffold is unchanged.

## Build and run

Use Node.js 22+ (24 recommended) and a toolkit package with /build.

    npm install
    npm run build
    npm test

Keep package-lock.json and use npm ci for later installs. Local package mode
needs vendor/canvas-toolkit.tgz; do not commit private tarballs.

Build checks the emitted entry using a test SDK adapter; an unused import or
missing connection fails. npm run check repeats that check without rebuilding.
Tests cover domain/server behavior, not browser rendering or native activation.

Use the host skill to install the whole dist/ directory, reload the provider
and open the panel. It contains bundled toolkit code and browser assets; only
@github/copilot-sdk/extension is host-provided. There is no automatic watch or
reload. A panel refresh does not replace the provider.

Try get_state with {}, increment with {"amount":1}, and reset with {}.
The buttons call those same actions.

## Customize

- src/domain.mjs: validated actions and shared state.
- src/browser/: UI and toolkit styles.
- src/canvas.mjs: toolkit server, assets and canvas behavior.
- src/toolkit.mjs: native adapter and shutdown.
- scripts/build.mjs: Node/browser builds and asset copying.

Keep the generated toolkit asset layout. New app assets need a build copy and
an allowlisted server route. Check images in a real browser as well as controls;
do not relax CSP to fix loading errors. State is temporary, not durable storage.
The counter includes no Azure access, telemetry or prompt forwarding.
`,
    "AGENTS.md": String.raw`# App development

First invoke the GitHub Copilot app's installed create-canvas skill through the
host skill mechanism (or continue it if already active). It is the source of
truth for canvas apps, including native scaffolding and host verification.
The setup command copied a host-owned entry without modifying it. Read README.md
for the required attachToolkit import/wrapper at the host customization step.
Do not replace joinSession or invent a second provider. If the skill is missing,
report the prerequisite and do not claim native activation.

Use Node >=22. After source changes run npm run build and npm test.
UI and agent actions must use the same domain schemas, dispatch, and state.
Preserve loopback/origin/CSP protections and the exact host SDK external.
Keep browser imports free of Node and host SDK code. Preserve all emitted assets.
Do not install/activate without explicit scope; no implicit user/global installs.
No console.log in provider code: stdout belongs to host RPC. Errors go to the
caller, UI, or stderr; do not turn failures into successful results.
Keep package-lock.json. Do not commit private vendor tarballs or generated bundles.
`,
};

export async function main(args = process.argv.slice(2)) {
    try {
        if (args.length === 1 && args[0] === "--help") {
            process.stdout.write(HELP);
        } else {
            const destination = await scaffold(args);
            process.stdout.write("Created toolkit source app: " + destination + "\nNOT READY: the copied host entry is unchanged. Follow README.md to connect attachToolkit, then npm install, npm run build, and npm test. Return to the host skill for native verification.\n");
        }
    } catch (error) {
        process.stderr.write("setup-toolkit: " + error.message + (error.cause ? "\nCause: " + error.cause.message : "") + "\n");
        process.exitCode = 1;
    }

}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
