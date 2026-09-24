# Microsoft Canvas Toolkit

`@microsoft/canvas-toolkit` provides shared APIs, UI components, and developer
tools for building Copilot canvas extensions. Azure is one integration, not a
requirement for using the shared UI.

See [License](#license) for licensing and attribution.
There is no root package export; import one of the entry points below.

## Start here

**[Build your first Azure canvas](quickstart.md)** using the authoring plugin's
resource-group starter, then customize it. The guide and example are included
in the package; no source checkout is needed.

Already have an app? Choose an [entry point](#entry-points) below or browse the
[Azure examples](examples/README.md).

This reference covers [app structure](#canvas-skeleton),
[Azure access](#azure-access), [UI and packaging](#shared-ui), and optional
[telemetry](#product-usage-telemetry) and [command logs](#commands-log).

## Setup and exports

Use Node.js 22 or newer (24 recommended). Install the toolkit in your application:

```bash
npm install @microsoft/canvas-toolkit
```

To install from a downloaded package tarball instead, use its local path:

```bash
npm install "<path-to-toolkit-package>.tgz"
```

Retain your application's lockfile for reproducible package and dependency
versions. The canvas host's extension SDK is not a toolkit runtime dependency.
The Azure CLI authentication source requires Azure CLI 2.61 or newer.

The [quickstart](quickstart.md), [authentication guide](auth.md), and
[read-only examples](examples/README.md) are included in the package.
They do not require access to a source repository.

### Entry points

| Entry point | Exports or content |
| --- | --- |
| `@microsoft/canvas-toolkit/build` | Typed `prepareCanvasUiAssets(outDir)`; copies shared UI assets and supplies bundler paths (Node.js, build time only) |
| `@microsoft/canvas-toolkit/server` | `startCanvasServer`; loopback HTTP transport with a secret path prefix, Host/Origin checks, CSP, bounded JSON, SSE and an asset allowlist |
| `@microsoft/canvas-toolkit/actions` | `defineActions`, `validate`, `InputError`, and JSON-Schema builders (`str`, `int`, `bool`, `num`, `enum_`, `constant`, `arr`, `obj`, `oneOf`, `empty`, `guid`); the shared input-validation gate |
| `@microsoft/canvas-toolkit/state` | Optional `createViewStore`; a tiny versioned, observable view-model store |
| `@microsoft/canvas-toolkit/session` | `createSessionBridge`; the safe UI→agent bridge (named server-built prompts, no raw prompt text from the iframe) |
| `@microsoft/canvas-toolkit/auth` | `createAzureAuthSession`, `AuthError`; session-based CLI or explicit `TokenCredential` authentication |
| `@microsoft/canvas-toolkit/azure` | Optional `createArmClient`, `createPipelineRequest`, `listArm` |
| `@microsoft/canvas-toolkit/subscriptions` | Pure `normalizeSubscriptionScope`, `SubscriptionError`; no CLI discovery |
| `@microsoft/canvas-toolkit/testing` | `createTestAzureAuthSession` with an isolated CLI-source factory; typed hermetic testing, not production authentication configuration |
| `@microsoft/canvas-toolkit/icons` | `iconForType`, `GENERIC_ICON`, `BY_TYPE`, `azureIconAssets` |
| `@microsoft/canvas-toolkit/ui` | `canvasUiAssets` |
| `@microsoft/canvas-toolkit/ui/theme` | `readCanvasTheme`, `observeCanvasTheme`; read computed theme values and observe changes with a returned cleanup function |
| `@microsoft/canvas-toolkit/ui/icons` | `createIcon`, `hydrateIcons` |
| `@microsoft/canvas-toolkit/ui/locations` | `formatAzureLocation` (display-only browser module) |
| `@microsoft/canvas-toolkit/ui/visual-profiles` | Typed metadata and lookup for opt-in visual profiles |
| `@microsoft/canvas-toolkit/ui/styles.css` | Shared CSS primitives |
| `@microsoft/canvas-toolkit/ui/profiles/coreai-azure.css` | Opt-in generated CoreAI Azure compatibility profile |
| `@microsoft/canvas-toolkit/ui/subscription-picker` | `createSubscriptionPicker` (browser module) |
| `@microsoft/canvas-toolkit/ui/azure-subscription-picker` | `createAzureSubscriptionPicker` (Azure-backed selector) |
| `@microsoft/canvas-toolkit/ui/subscription-picker.css` | Subscription picker styles |
| `@microsoft/canvas-toolkit/commands` | `createCommandLog`; server-side, DOM-free, redaction-safe command-activity record log |
| `@microsoft/canvas-toolkit/ui/commands-log` | `createCommandsLog` (browser module); the read-only command-activity panel |
| `@microsoft/canvas-toolkit/ui/commands-log.css` | Command-activity panel styles |
| `@microsoft/canvas-toolkit/telemetry` | `createPublicCanvasUsageMetrics` for the release-owned collector; default-off `createCanvasUsageMetrics` for caller-owned collection; action instrumentation helpers |
| `@microsoft/canvas-toolkit/ui/telemetry` | `observeCanvasUsage`; trusted panel interactions from a static control allowlist |

## Canvas skeleton

The toolkit connects a browser view to Node-side actions through a same-origin
HTTP API. Use the server and action validation together or independently;
the state store and session bridge are optional. Native registration and
lifecycle still belong to the host.

- **`server` — `startCanvasServer(options)`.** The loopback server. Binds to
  `127.0.0.1` on an ephemeral port (never the network), mints a per-launch
  secret path prefix (unguessable URL, constant-time compared), enforces strict
  Host/Origin + same-origin-POST checks, sets a locked-down CSP (`script-src
  'self'`) and safety headers, parses bounded JSON, and exposes
  `POST {prefix}api/action` → your `dispatch(name, input)`, `GET
  {prefix}api/state` → your `model()`, and `GET {prefix}events` → an SSE change
  stream driven by your `subscribe(notify)`. Static files come from an
  exact-match `assets` allowlist; dynamic endpoints a static asset can't serve
  (e.g. an OAuth redirect, or extra POST routes) use `routes`. Returns
  `{ url, origin, port, close }`. Because the CSP is `script-src 'self'`, the
  iframe's client JS must be a same-origin asset (`<script src="app.js">`), not
  inline. It is deliberately unopinionated about state — pass any
  `dispatch`/`model`/`subscribe`.

- **`actions` — `defineActions(...)`, `validate` and schema builders.** Share
  input validation between UI requests and host actions. Objects reject unknown
  fields by default (`additionalProperties: false`); a schema-valued
  `additionalProperties` validates dictionary entries. Builders emit JSON
  Schema for the host registry. Invalid input raises `InputError` with
  `code: "invalid_input"`. Validation is not authorization; keep scope binding
  and confirmation in the handler.

- **`state` — `createViewStore(...)` (optional).** A tiny versioned, observable
  view-model store so a canvas doesn't hand-roll one. Every committed change
  bumps `version` (so the UI can drop stale optimistic updates and human/agent
  races), and subscribers are notified fire-and-forget after a change so the
  server can push an SSE `change`. Not a database, router, or reducer — bring
  your own persistence and handlers. The server and actions work without it.

- **`session` — `createSessionBridge(session, ...)`.** The safe UI→agent
  direction. The untrusted iframe must never hand raw prompt text to the agent
  (prompt injection); instead the canvas registers named prompt *builders*
  server-side, the browser names one and passes validated params, and the
  prompt string is constructed out of the view's reach. The trigger comes from
  the click; the words come from the extension.

## Product-usage telemetry

Product telemetry records `canvas_opened`, `feature_invoked`,
`feature_completed` and `ui_interaction`. It does not query customer Application
Insights logs or deploy collector infrastructure. Choose the release-owned
public collector or the lower-level client for your own collection policy.

The toolkit exposes two layers:

- `createPublicCanvasUsageMetrics` is always enabled, credential-free, and uses
  the release-owned public endpoint. It rejects consumer enablement,
  destination, transport, clock, event-ID generator, audience, and
  token-provider options.
- `createCanvasUsageMetrics` is the lower-level explicit API. It remains
  default-off for internal, authenticated, or custom-transport scenarios.

`PUBLIC_CANVAS_USAGE_SERVICE` is the shared service binding for every
registered public canvas. It owns one service ID, schema version, data
classification, and event endpoint; canvases do not define per-canvas
destinations. `PUBLIC_CANVAS_USAGE_ENDPOINT` remains an alias for compatibility.

Neither API reads environment variables. Never reuse a customer's Application
Insights connection for product-usage events.

```js
import { createPublicCanvasUsageMetrics } from "@microsoft/canvas-toolkit/telemetry";

const metrics = createPublicCanvasUsageMetrics({
    contract: FUNCTION_STUDIO_USAGE_CONTRACT,
    canvasVersion: "0.5.0",
    releaseChannel: "preview",
});
```

Public canvases expose no customer setting that disables or redirects this
collector. The shared client asks the stored `github.com` GitHub CLI account for
its numeric user ID without exporting a GitHub token. That ID crosses the
TLS-protected request path and is HMACed by the gateway; only the stable
server-derived key and key version are persisted for the 30-day repeat-customer
window. If GitHub CLI identity is unavailable, events continue without an
identity key and a safe diagnostic is emitted.

The persisted key is pseudonymous personal data, not anonymous data. The table
contains no GitHub login, tenant, installation, device, session, network, IP,
subscription, or Azure resource identifier. Front Door/WAF separately process
source network information. Credential-free traffic and claimed GitHub IDs are
spoofable, so these counts must not drive billing, entitlement, compliance, or
security decisions.

Use the lower-level API when collection policy and transport are explicitly
owned by the caller:

```js
import {
    createCanvasUsageMetrics, instrumentCanvasActions, instrumentActionDispatch,
} from "@microsoft/canvas-toolkit/telemetry";

const metrics = createCanvasUsageMetrics({
    canvasId: "example",
    canvasVersion: "1.0.0",
    host: "copilot_app", // or "mcp_app"
    releaseChannel: "development",
    enabled: false,
    // endpoint: "https://metrics.example.test/api/events", // your approved destination
    actionUsage: {
        refresh: {
            featureId: "resources.refresh", featureArea: "discovery",
            usageClass: "intentional", mutates: false,
        },
    },
    controls: { refresh: "button" },
});

// SDK actions: wrappers validate registry coverage even when collection is off.
const actions = instrumentCanvasActions([
    { name: "refresh", handler: async () => ({ count: 0 }) },
], metrics, { invocationSource: "model" });
// For a toolkit defineActions registry, wrap its dispatch instead:
// const dispatch = instrumentActionDispatch(registry.dispatch, metrics,
//     { invocationSource: "panel" });
metrics.trackCanvasOpened("model"); // defaults to "unknown"
// await metrics.close({ flush: false }); // discard/cancel at owning lifecycle end
```

For authenticated HTTP collection, the application explicitly supplies its own
endpoint, audience, opt-in decision, and token provider. The provider returns a
token string or `{ accessToken: string }` and must honor the supplied signal:

```js
function createApplicationMetrics({ collectionAllowed, endpoint, audience, acquireToken }) {
    return createCanvasUsageMetrics({
        canvasId: "example", canvasVersion: "1.0.0",
        enabled: collectionAllowed === true,
        endpoint, // e.g. https://metrics.example.test/api/events; no credentials/query/fragment
        audience, // e.g. api://your-collector, not a toolkit-selected Azure resource
        getAccessToken: (requestedAudience, signal) => acquireToken(requestedAudience, signal),
        actionUsage: {
            refresh: {
                featureId: "resources.refresh", featureArea: "discovery",
                usageClass: "intentional", mutates: false,
            },
        },
    });
}
```

Token acquisition and fetch share one request deadline. Without `getAccessToken`,
HTTP delivery has no Authorization header. No Azure CLI, environment-variable
lookup, or audience discovery exists in the low-level collector.
Disabled collectors never invoke authentication, fetch, or custom transports.

Alternate destinations can own serialization and authentication entirely:

```js
function createAlternateMetrics({ collectionAllowed, writeApprovedBatch }) {
    return createCanvasUsageMetrics({
        canvasId: "example", canvasVersion: "1.0.0",
        enabled: collectionAllowed === true,
        transport: async (events, { signal }) => {
            await writeApprovedBatch({ schemaVersion: 2, events }, { signal });
        },
    });
}
```

A custom `transport` replaces HTTP and token acquisition, requires no endpoint,
and receives only immutable allowlisted events plus the cancellation signal.
The low-level collector still enforces opt-in, queue bounds, and deadlines. Hooks must honor
cancellation to stop their own external work; the collector bounds its wait even
if a hook ignores the signal.

Use reviewed **code constants** for canvas/version, feature/action, and control
registries. They are not a general properties bag: never derive them from user
input, visible text, resource names/IDs, paths, URLs, commands, or errors.
When more than one canvas or the ingestion gateway uses the same metrics,
publish one immutable `CanvasUsageContract` from the shared domain package and
pass it as `contract` with the current `canvasVersion`. A contract owns the
canvas ID, host, registered release versions, action metadata, and controls;
those fields cannot be overridden per collector. Keep product-specific
contracts out of the generic toolkit.

```js
const metrics = createCanvasUsageMetrics({
    contract: FUNCTION_STUDIO_USAGE_CONTRACT,
    canvasVersion: "0.5.0",
});
```

Registries are copied; unregistered action/control metadata and unknown runtime
enums are rejected with safe diagnostics. Events project only the declared
fields. The public service may add a server-derived GitHub user key; no raw ID
is persisted and lower-level/custom collectors add no identity unless their
caller explicitly configures an identity resolver.

`usageClass` distinguishes `intentional` actions from `automatic` background
work; `excluded` actions produce no events. The wrappers preserve results and
original exceptions, receivers and arguments. Resolved `ok: false` or
`isError: true` results are `rejected`; `cancelled: true` or `canceled: true`
takes precedence and is `cancelled`. Thrown `AbortError`s are `cancelled`; other
exceptions are `failed`. Otherwise completion is `succeeded`. Failure codes are
always respectively `action_rejected`, `action_cancelled`, `action_error`, or
the empty string; raw errors are never included. Result accessors and throwing
Proxy metadata traps are not allowed to replace the application's result.
This measures dispatch completion, not eventual background-job success.
Invocation source is set by the trusted adapter (`model`, `panel`,
`system`, or `unknown`), never copied from input. Do not instrument the same
dispatch twice. SDK action wrappers alone do not measure panel HTTP-route
outcomes; wire those dispatch paths explicitly if required. SDK wrappers also
accept `openedActions: ["open_canvas"]` and a trusted
`invocationSource(context, action)` resolver; dispatch wrappers accept the same
opened-action list and `invocationSource(name, ...args)`. Resolver and telemetry
callback failures are isolated from the original handler.

For the iframe, serve `canvas-ui/telemetry.mjs` from `canvasUiAssets` and call
`observeCanvasUsage({ root: document, enabled, controls, send, onDiagnostic })`.
`send` should POST only `{ interactionType, controlId, controlType }` to the
canvas's protected same-origin route, which calls `metrics.trackUiInteraction`.
Use `data-metric-id` or an `id` from the same reviewed control allowlist in both
places. Only trusted `click`, committed `change`, and `submit` events on those
controls are captured; `toggle` and programmatic events are excluded. No text,
values, DOM content, or coordinates are read into events. Native buttons and
elements with `role="button"` use control type `button`; forms use `other`.
Call the returned `dispose()` before replacing an observer. The helper
is self-contained for existing inline-renderer consumers; ordinary module
consumers should serve it under their existing strict CSP.

The Node transport posts `{ schemaVersion: 2, githubUserId?, events: [...] }` to
credential-free HTTPS, rejects query/fragment configuration, omits ambient
credentials, and refuses redirects even with a bearer token. Every event includes `schemaVersion`,
`canvasId`, `canvasVersion`, `host`, `releaseChannel`, `timestamp`, `eventId`,
`eventName`, and `invocationSource`. Feature events add only the registered
`featureId`, `featureArea`, `actionName`, `usageClass`, and `mutates`; completions
add `outcome`, integer `durationMs` clamped to 0–3,600,000, and `failureCode`.
UI interactions add only `interactionType`, `controlId`, and `controlType`.
This is the schema-v2 gateway envelope; that gateway independently
requires registered canvas releases/features and batches of at most 20.

Defaults: 20 events per batch, 100 queued events, 1-second flush interval, and
10-second request/total-close deadlines. Overflow drops the oldest queued event;
failed deliveries are dropped without retry or persistence. `flush()` delivers
at most one batch (concurrent calls share it). `cancelPending()` aborts only this
collector's active delivery; it does not disable this or other collectors.
`close({ flush: false })` immediately stops accepting events, discards queued
events, and cancels delivery; consumer adapters should use this lifecycle form.
Explicit `close()` callers instead drain within the total deadline. Both return
lifetime `{ delivered, dropped }` counts; timers do not keep the process alive.
Keep client ownership explicit: do not close a shared client when only one of
its panels closes, or reuse a closed client on reopen.

`getStats()` exposes delivered/dropped/invalid, queued/in-flight counts, and
closed state. `onDiagnostic({ code })` receives safe, deduplicated diagnostic
codes; without a callback they are stderr warnings. Both Node and browser
diagnostic callbacks may be synchronous or asynchronous. Throws and rejected
promises produce a fixed warning without blocking actions, delivery, or UI
interactions. No raw network or payload diagnostics are forwarded.

For isolated tests, use the lower-level client with injected `fetchImpl`, clock
and ID factories. Do not construct the always-enabled public collector in
fixture/test modes; those modes must not send production events.

## Azure access

Create a session, load its metadata and bind an explicitly selected scope.
The default source is Azure CLI; you can instead
[supply a `TokenCredential`](auth.md#explicit-credential-injection) and matching
identity metadata. See the [authentication reference](auth.md) for the full API.

```js
import { createAzureAuthSession } from "@microsoft/canvas-toolkit/auth";

const auth = createAzureAuthSession();
await auth.reloadProfile();
const context = auth.bindSubscription({
    subscriptionId,
    tenantId,
    cloud: "AzureCloud",
});
// Standard SDK clients receive context.credential.
// Custom HTTP clients retain an SDK-cached callback, not a fixed token:
const getToken = context.getBearerTokenProvider(
    "https://storage.azure.com/.default",
);
// Use context only for this generation; dispose auth when its owner ends.
```

Authentication is separate from resource scope: a tenant-only identity with zero
subscriptions can be connected. `bindTenant({ tenantId, cloud, accountName? })`
supports that case without inventing a subscription. Public Azure, Azure
Government, Azure China, macOS, Windows, and Linux are support targets, not proof
of completed live qualification.

`reloadProfile()` reads local metadata; `refreshFromAzure()` is a separate,
explicit CLI server refresh that may rewrite the shared profile and retain
stale accounts with warnings. External CLI changes need manual refresh in v1;
there are no watchers. `connect()` is explicit login, never an automatic
fallback. No default subscription/cloud/configuration changes are performed.

Keep clients tied to the session generation. Subscribe to explicit lifecycle
changes, cancel your requests and retire SDK clients on invalidation, then
rebind from the new snapshot. Local `disconnect()` is not CLI logout or token
revocation. `dispose()` ends the session's lifetime; dispose caller-owned
credentials/clients separately when their SDK requires it.

`@microsoft/canvas-toolkit/azure` is optional: `createArmClient(context)` uses the bound
cloud endpoint/audience and checks context validity for each request;
`listArm(context, path, options)` exposes incomplete paging rather than silently
claiming completion. Partners may use their own SDK/HTTP clients instead.
Both optional ARM APIs accept a per-client/listing `httpClient` implementing the
standard Azure SDK transport contract. No global HTTP override is exported.

Read [the auth guide](auth.md) for exact session and injected source shapes,
callback cancellation, safe errors, lifetime requirements, and
the [migration from global APIs](auth.md#migrating-earlier-examples).
The [read-only examples](examples/README.md) demonstrate SDK and custom HTTP
clients with explicit scope and no automatic sign-in.

## Subscription metadata and scope

`createAzureAuthSession()` owns metadata, identity, lifecycle, and scope
validation. Return its JSON-safe snapshot through the canvas's existing
authenticated transport; keep selection, persistence and resource-query state
outside the session.

```js
import { createAzureAuthSession } from "@microsoft/canvas-toolkit/auth";

const auth = createAzureAuthSession();
// Behind your existing authenticated, same-origin HTTP route:
const snapshot = await auth.reloadProfile();
// Return this JSON-safe snapshot, or a non-2xx response containing only the
// safe AuthError fields. Never serialize raw CLI failures.
// Dispose auth when the route's server owner ends, not after each request.
```

See [snapshot shapes and cloud names](auth.md#snapshots-and-signed-in-state) for
the metadata contract. Never send credentials to the picker.

`auth.resolveScope({ tenantId, subscriptionIds, cloud })` validates loaded
metadata without discovery. It rejects missing, disabled, ambiguous or
cross-tenant/cloud selections and returns normalized scope with display names.
Reload explicitly after external CLI changes.

For structural checks only, `@microsoft/canvas-toolkit/subscriptions` exports
`normalizeSubscriptionScope` and `SubscriptionError`. It validates GUIDs,
1-1000 unique subscription IDs and a supported cloud, normalizing IDs to
lowercase without contacting Azure. This does not establish account availability
or access; use the session for that selection check. See the
[migration guide](auth.md#migrating-earlier-examples) for removed global APIs.

## Shared UI

`canvasUiAssets` maps the shared stylesheet, icon module, and subscription picker
assets to `[file URL, content type]` pairs for the consumer's server. Mount those exact
assets under its existing same-origin route, load the stylesheet, and apply
`class="canvas-ui"` to opt into typography and controls.

The CSS includes `.canvas-header`, button styles, and `.canvas-list` row
primitives. `hydrateIcons()` replaces marked elements such as
`<span data-canvas-icon="refresh"></span>` with decorative SVGs.
Consumers still implement accessible labels, keyboard interaction, and state.

### Packaging shared UI

Use the Node-only build helper before bundling your provider and browser entry:

```js
import { prepareCanvasUiAssets } from "@microsoft/canvas-toolkit/build";

const ui = await prepareCanvasUiAssets("dist");
// ui.nodeImport:
// { specifier: "@microsoft/canvas-toolkit/ui", path: "./assets/toolkit/ui.mjs" }
// ui.browserImports includes:
// { "@microsoft/canvas-toolkit/ui/azure-subscription-picker":
//     "./canvas-ui/azure-subscription-picker.mjs", ... }
// ui.files: sorted emitted paths relative to dist, with slash separators.
```

The helper copies `ui.mjs` and all `canvasUiAssets` files into
`dist/assets/toolkit/`, preserving relative module and icon paths. Import it
only in build scripts. The emitted UI assets work without the toolkit package
or `node_modules` at runtime.

There are **two different path spaces**:

- **Node filesystem:** externalize `ui.nodeImport.specifier` at
  `ui.nodeImport.path`. Emit the provider at the **`outDir` root** so it can
  import `assets/toolkit/ui.mjs` without bundling that module.
- **Browser URLs:** externalize each `ui.browserImports` key at its value.
  These are **URL paths, not disk paths**. Serve the browser entry at the
  canvas URL root and mount `canvasUiAssets` through the server's secret prefix.

For example, with esbuild as an application-owned **dev dependency**:

```js
import { build } from "esbuild";
import { prepareCanvasUiAssets } from "@microsoft/canvas-toolkit/build";

const outDir = "dist";
const ui = await prepareCanvasUiAssets(outDir);
const boundaries = imports => ({
    name: "canvas-ui-boundaries",
    setup(builder) {
        builder.onResolve(
            { filter: /^@microsoft\/canvas-toolkit\/ui(?:\/|$)/ },
            ({ path }) => imports[path]
                ? { path: imports[path], external: true }
                : undefined,
        );
    },
});
await build({
    entryPoints: ["src/extension.mjs"], outfile: `${outDir}/extension.mjs`,
    bundle: true, platform: "node", format: "esm",
    external: ["@github/copilot-sdk"], // Retain the native scaffold's host SDK boundary.
    plugins: [boundaries({ [ui.nodeImport.specifier]: ui.nodeImport.path })],
});
await build({
    entryPoints: ["src/app.js"], outfile: `${outDir}/app.js`,
    bundle: true, platform: "browser", format: "esm",
    plugins: [boundaries(ui.browserImports)],
});
```

Keep the scaffold's other build settings. UI exports outside the returned map
can bundle normally. **CSS is not externalized**: serve the copied styles or
bundle CSS and link the emitted stylesheet. The helper does not copy app HTML,
code or the separate `azureIconAssets` catalog, or configure the server.

`outDir` is relative to the build's working directory. Use a directory without
concurrent writers. Missing/unsafe files, symlink output paths, invalid parents
and conflicting bytes fail; identical files are accepted and unrelated files
are left alone. The helper never cleans output. Use a fresh directory after
upgrades and discard incomplete output after a failed build.

Test a relocated app, including image decoding. Flattening the picker into
`app.js` breaks its module-relative SVG URL even if the JavaScript still runs.

### Styling and themes

Serve the full `canvasUiAssets` map with `startCanvasServer`:

```js
import { startCanvasServer } from "@microsoft/canvas-toolkit/server";
import { canvasUiAssets } from "@microsoft/canvas-toolkit/ui";

const server = await startCanvasServer({
    dispatch: actions.dispatch,
    assets: new Map([
        ...canvasUiAssets,
        ["", new URL("./index.html", import.meta.url)],
        ["app.js", new URL("./app.js", import.meta.url)],
    ]),
});
// Close server when its owner ends.
```

In your `index.html`, load scripts and styles from that same token-scoped origin:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Resources</title>
  <link rel="stylesheet" href="./canvas-ui/styles.css">
</head>
<body class="canvas-ui">
  <header class="canvas-header">
    <h1>Resources</h1>
    <button class="secondary-button" type="button" id="refresh">
      <span data-canvas-icon="refresh" aria-hidden="true"></span>
      Refresh
    </button>
  </header>
  <main id="content"></main>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

Your `app.js` can import `hydrateIcons` from `./canvas-ui/icons.mjs` and call
`hydrateIcons(document)`. Keep scripts external: the server's CSP does not allow
inline scripts or event-handler attributes.

The stylesheet maps available host CSS variables to `--canvas-bg`,
`--canvas-fg`, `--canvas-muted`, `--canvas-border`, `--canvas-accent`, and
`--canvas-focus`, with light/dark fallbacks. It does not install a host theme
bridge or expose a theme-switching JavaScript API. Host token injection and
theme changes remain the host's responsibility. Preserve the document's
`rem` base; use the shipped typography and control styles instead of resetting
the root font size. Test keyboard focus, forced colors, reduced motion, and
narrow layouts in your target host. CSS alone does not provide accessible
interaction or authorization.

### Optional visual profiles

Named visual profiles layer over the shared stylesheet without changing its
defaults. For `coreai-azure`, load `./canvas-ui/profiles/coreai-azure.css` after
`./canvas-ui/styles.css` and add `canvas-profile-coreai-azure` alongside
`canvas-ui` on the root element or body. `canvasUiAssets` includes the stylesheet;
`COREAI_AZURE_VISUAL_PROFILE` from
`@microsoft/canvas-toolkit/ui/visual-profiles` exposes its ID, class name, and
asset path.

This toolkit-native compatibility layer does not bundle an upstream UI library
or font binaries. Aptos and Aptos Mono are used only when installed locally,
with host and system font fallbacks. It needs no additional runtime dependency
or network request.

### Following the host theme

`styles.css` prefers valid `data-theme-tone` (`light` / `dark`), then valid
`data-color-mode`, to reconcile native controls and `light-dark()` fallbacks.
Without either, the browser's OS preference applies. It never writes host
attributes or shrinks the root `rem` base. Shared buttons, the subscription
picker and command activity use semantic color/type roles and honor
`pointer-on-hover`; ordinary activity rows are flat, not elevated cards.

Charts that need resolved colors can use `canvas-ui/theme.mjs`, served alongside
`styles.css`. The equivalent package import is
`@microsoft/canvas-toolkit/ui/theme`:

```js
import { readCanvasTheme, observeCanvasTheme } from "./canvas-ui/theme.mjs";
const initial = readCanvasTheme();
const stop = observeCanvasTheme(theme => {
    chart.setColors(theme.colors); // your renderer's adapter, not a toolkit API
});
// Call stop() when unmounting; pagehide also disconnects the observer.
```

Both helpers require a rendered document and the shared stylesheet. The observer
emits an initial snapshot and coalesces/deduplicates late stylesheet delivery,
root/body attribute changes and OS-mode updates. The snapshot contains resolved
`tone`, `colors` (`bg`, `fg`, `muted`, `border`, `accent`, `success`, `attention`,
`danger`), body `fontFamily`, `fontSize`, `background`, `foreground`, and
`hasHostTokens`. That last field only detects the host background token; it
does not establish complete theme delivery. No page text, resource state or
credentials are sampled, and no host state is modified.

Font stacks do not install font files. The helpers do not propagate themes to
nested frames, register an action, or relax the consumer's CSP. Non-nonced host
style injection must still be permitted by the page's actual policy. Browser
simulation under the toolkit server's CSP is covered separately from native
app delivery.

### Azure location labels

`formatAzureLocation(location)` returns an English display name for a recognized
public Azure region ID, matching case-insensitively without trimming. It is a
pure, dependency-free browser module: no Azure calls, authentication, inventory,
or DOM access. Its static lookup uses the **Region** and **Programmatic name**
columns of Microsoft's [public Azure regions list](https://learn.microsoft.com/en-us/azure/reliability/regions-list),
verified on 2026-09-16. This snapshot is not a location availability or validation
API; it does not enumerate sovereign clouds, extended locations, or every future
region. Add entries only after verifying their programmatic name and label.

Unknown, custom, extended, and other unlisted locations return the exact original
string; there is no inferred capitalization, spacing, suffix handling, or
normalization. `null`, `undefined`, empty strings, and non-string values also pass
through unchanged so consumers retain their own missing-value behavior.

```js
import { formatAzureLocation } from "@microsoft/canvas-toolkit/ui/locations";

formatAzureLocation("westeurope"); // "West Europe"
formatAzureLocation("eastus2"); // "East US 2"
formatAzureLocation("westus3"); // "West US 3"
formatAzureLocation("custom-location"); // "custom-location"
```

For direct iframe imports, mount the complete `canvasUiAssets` map behind the
existing same-origin, token-scoped route and import
`{ formatAzureLocation } from "./canvas-ui/locations.mjs"`. The asset is served as
`text/javascript; charset=utf-8`; no build step or separate data file is needed.

Apply the helper only while rendering labels, consistently in rows and detail
fields. Preserve raw locations in resources, queries, filters, sort keys, exports,
and handoff data. The result is text, not sanitized HTML: keep the consumer's
existing escaping or use `textContent`, including for unknown location values.

### Subscription picker

For Azure canvases, use the [Azure subscription selector](#azure-subscription-selector)
below. `createSubscriptionPicker` is the lower-level DOM primitive it builds on;
consumers should not repeat Azure account normalization or refresh logic.

The browser-native component owns its modal dialog, keyboard interaction, draft
selection, and applied summary button. It has no framework dependency and does
not fetch Azure data, authenticate, or persist scope. The consumer supplies
subscriptions and implements `onApply`; successful completion is the commit boundary.

Mount all entries from `canvasUiAssets` behind the canvas's existing same-origin,
token-scoped route. In addition to `styles.css` and `icons.mjs`, this includes:

- `canvas-ui/profiles/coreai-azure.css` (optional named visual profile)
- `canvas-ui/subscription-picker.mjs`
- `canvas-ui/azure-subscription-picker.mjs` (the Azure-backed wrapper)
- `canvas-ui/subscription-picker.css`
- `icons/Subscription.svg` (the existing `src/icons/Subscription.svg` asset)

The module imports `./icons.mjs` and resolves its mark with
`new URL("../icons/Subscription.svg", import.meta.url)`. This points to the real
asset in the package and stays inside the server's token directory. Mounting the
complete asset map provides this icon route; no external image request is needed.
Use `@microsoft/canvas-toolkit/ui/subscription-picker` with a bundler, or the served URL
shown below for a direct browser import. Load both stylesheets; the component uses
shared `--canvas-*` aliases for documented canvas theme tokens, with `canvas-subscription-picker`-prefixed
selectors to avoid consumer CSS collisions.

```html
<link rel="stylesheet" href="./canvas-ui/styles.css">
<link rel="stylesheet" href="./canvas-ui/subscription-picker.css">
<button id="scope" type="button">Choose subscriptions</button>
```

```js
import { createSubscriptionPicker } from "./canvas-ui/subscription-picker.mjs";

const picker = createSubscriptionPicker({
    id: "resource-scope", // unique within this document; no whitespace
    trigger: document.getElementById("scope"),
    selectionMode: "multiple",
    singleGroup: true,
    onApply: async items => {
        await saveScope(items.map(item => item.key)); // consumer-owned operation
    },
});
picker.setState({
    subscriptions: [{
        key: "principal:cloud:subscription", // caller-owned opaque identity
        id: "00000000-0000-0000-0000-000000000001",
        name: "Development",
        tenantId: "00000000-0000-0000-0000-000000000002",
        tenantName: "Contoso",
        cloud: "AzureCloud",
        isDefault: true,
    }],
    selectedKeys: ["principal:cloud:subscription"],
    loading: false,
    error: null,
});
// Only explicit first-entry confirmation shows the default card:
picker.open({ confirmDefault: true });
// Later trigger clicks, or picker.open(), open the subscription list directly.
// On teardown:
// picker.destroy();
```

`createSubscriptionPicker(options)` accepts:

| Option | Behavior |
| --- | --- |
| `document` | Defaults to `globalThis.document`; injectable for tests |
| `id` | Required, unique, nonempty string without whitespace; used verbatim for the dialog ID and to namespace prefixed internal control IDs |
| `trigger` | Optional existing button from the document; otherwise creates an unmounted button for the caller to append |
| `triggerVariant` | `"toolbar"` (default icon pill and Change segment) or `"field"` (full-width, single-outline field with a leading icon and trailing chevron) |
| `mount` | Optional dialog container; defaults to `document.body` |
| `selectionMode` | `"multiple"` (checkboxes, default) or `"single"` (native radios) |
| `singleGroup` | Defaults to `false`; when true, selected items must share a case-insensitive `tenantId` and exact `cloud` |
| `onApply(items)` | Required callback receiving snapshots of selected item objects; may return a promise |
| `onRefresh()` | Optional async callback enabling a Refresh subscriptions button inside the picker; update candidates with `setState` and reject on failure |
| `onCancel()` | Optional notification on Cancel, close button, Escape, outside dismissal, or `close({ cancelled: true })`; not called on plain `close()`, successful Apply, or destroy |
| `onOpenChange(open)` | Optional notification of actual open/close transitions, including closing during destroy |

Use `triggerVariant: "field"` for a picker embedded in a filter form. It uses a
32px control height by default (`--canvas-control-height` can override it),
normal text weight, left-aligned content and the same host control tokens as
input fields. A single selected name truncates without growing the trigger;
multiple selections display a count. The full names remain in its accessible
name and tooltip. The Azure-backed wrapper forwards this option too.
This changes only the trigger, not the dialog size, selection model, search,
keyboard interaction or confirmation behavior. The existing toolbar variant
remains the default.

Each subscription has required string `key`, `id`, `name`, and `tenantId` fields.
Optional fields are `tenantName`, `cloud`, `isDefault`, `disabled`, and
`disabledReason`. `key` must be unique and nonempty. Keys are never normalized or
derived from subscription IDs: the consumer must distinguish principals and clouds.
Tenant grouping uses `[tenantId.toLowerCase(), cloud ?? ""]`, independent of keys.

The controller exposes `{ trigger, dialog, setState, open, close, destroy, isOpen }`.
`setState({ subscriptions, selectedKeys, loading, error, refreshDisabledReason })` is a partial update;
`selectedKeys` accepts an array or Set of opaque strings, and `subscriptions: []`
explicitly clears the available candidates. `error` accepts an Error, message,
or `null` to clear. While open, updates preserve the draft and search query,
including during account refresh. `selectedKeys` updates the applied selection,
not the open draft. Removed or disabled draft keys remain selected and block
Apply with an explanation; **Clear selection** explicitly removes them.
`refreshDisabledReason` disables refresh with an explanatory tooltip; pass `null`
to enable it again. Use this when a consumer must keep a pending request's
candidate snapshot fixed.

- **Entry:** `open()` is idempotent. `open({ confirmDefault: true })` shows the
  default card only when exactly one enabled default candidate exists and loading
  is false. Continue submits that one item; Choose subscriptions opens the list.
- **Selection:** Apply requires at least one available, enabled subscription.
  Search matches subscription/tenant names and IDs (and cloud). Select all acts on
  enabled search matches; Clear selection clears those matches without losing
  selections hidden by search. In single/group-constrained mode or when selected
  items become unavailable, Clear selection clears the entire draft for recovery.
  In single-group mode, incompatible rows cannot be added and show a visible
  explanation; clear the draft before switching tenant/cloud. Mixed selections are never silently
  cleared, including in single mode.
- **Commit:** Draft changes do not alter the summary until `onApply` succeeds.
  Rejection keeps the dialog open with an inline error. Pending Apply disables
  editing and dismissal, including `close()`, to prevent duplicate requests.
  Candidates are validated again after completion in case refresh removed or
  disabled them. The summary shows one icon pill: a name for one selection, a count
  for multiple, or “Choose subscriptions” for none, plus Change and a chevron.
- **Refresh:** The picker owns pending/error feedback and duplicate prevention.
  Refresh keeps search and draft selection intact and never applies scope.
  Editing and dismissal are disabled until the callback settles; failures appear
  inline and can be retried. The consumer owns account discovery and supplies
  refreshed candidates and any external error state through `setState`.
- **Accessibility:** Native modal focus containment and Escape behavior, explicit
  labels and live counts/errors, arrow-key row navigation, CSS name truncation with
  full accessible text/title, and focus restoration on close. Dismissal requires
  both pointer-down and click outside the dialog, not a drag that started inside.
- **Disposal:** `destroy()` removes listeners and the dialog, removes an owned
  trigger or restores the supplied trigger's original content/modified attributes,
  and ignores late async results. It cannot cancel work already started by the
  consumer's callback. Other controller methods become no-ops after disposal.
  The consumer retains control of an existing trigger's disabled state.

Plain `close()` dismisses without reporting cancellation, so consumers can replace
a manually opened picker with an agent request or dismiss a stale request. Use
`close({ cancelled: true })` only to explicitly report cancellation. Both forms
are ignored while Apply or Refresh is pending. On every close, `isOpen` becomes false and
the summary is updated before focus restoration and `onOpenChange(false)`.
Focus restoration happens **before** that callback, allowing the consumer to
update state or focus its own editor without the picker stealing focus afterward.

### Azure subscription selector

The toolkit owns both sides of subscription selection:

- `createAzureAuthSession()` owns the shared auth snapshot, explicit reload and
  server refresh, and server-side `resolveScope()` validation. Return its
  JSON-safe metadata through the canvas's existing authenticated transport.
  See [subscription metadata and scope](#subscription-metadata-and-scope) above.
- `createAzureSubscriptionPicker()` owns account-to-option normalization, disabled
  and ambiguous accounts, missing selected subscriptions, draft selection,
  single-tenant/cloud/principal validation, sign-in guidance, refresh and errors.
  The consumer mounts it, connects a JSON transport, and receives a selected scope.

Browser-side (serve the full `canvasUiAssets` map and load both shared stylesheets):

```js
import { createAzureSubscriptionPicker } from "./canvas-ui/azure-subscription-picker.mjs";

const picker = createAzureSubscriptionPicker({
    id: "scope-picker",
    trigger: document.getElementById("scope"),
    statusMount: document.getElementById("scope-status"),
    // postJson is your existing HTTP helper, not an Azure-specific callback.
    transport: () => postJson("./api/subscriptions", {}),
    onApply: async scope => {
        await saveScope(scope); // validate with resolveScope on the server
        picker.setState({ scope });
    },
});
picker.setState({ accounts: initialAccounts, scope: currentScope });
```

`transport()` resolves to `{ accounts, error?, revision? }`; the session's
JSON-safe snapshot can be returned directly. The picker applies
refreshed metadata without committing scope or running a resource query; transport
rejections are shown inline. `error` can be a safe message or `{ code, message }`.
The optional `statusMount` receives toolkit-owned sign-in/error feedback; otherwise
the returned `status` element can be mounted by the consumer.

`onApply(scope)` receives `{ tenantId, tenantName, cloud, subscriptionIds,
subscriptions: [{ id, name }], selectedKeys }`, after Azure selection validation.
The callback must finish committing scope before resolving. Push committed scope
back through `setState` so subsequent metadata refreshes retain it. Browser
validation is selection guidance, not authorization: use the session's
`resolveScope` on the server before running operations in that scope. Start any
follow-on UI action that requires a closed dialog from `onOpenChange(false)`,
not from inside Apply.

`setState` accepts `{ accounts, scope, error, loading, selectedKeys,
refreshDisabledReason, revision }` as partial updates. Normally `scope` determines
the applied summary. Supply `selectedKeys` for a fixed server-side confirmation
request (opaque `account.key` values are preserved); pass `selectedKeys: undefined`
to resume deriving selection from scope. A refresh-disabled reason prevents
changing that fixed candidate snapshot. If using revisions, push and return values
from the same monotonic sequence so stale refresh responses cannot replace newer
state. Open drafts and search survive metadata updates; stale selected keys require
explicit clearing.

The controller exposes `trigger`, `dialog`, `status`, `setState`, `open`, `close`,
`destroy` and `isOpen`. It supports the low-level picker's mounting and lifecycle
options, but owns `singleGroup`, `onRefresh`, and Azure validation itself.
It never receives credentials, signs in, or calls Azure directly.

## Commands log

A command log records the real operations a canvas runs on the user's behalf
(az CLI, ARM/REST, data-plane calls) so an engineer can see what the tool did.

- **`commands` — `createCommandLog(options)` (server-side, DOM-free).** Owns the
  record lifecycle only: `start`/`end`/`wrap` an operation, `list`, `clear`. It
  is a bounded newest-first ring buffer (`limit`, default 50) and is
  redaction-safe — pass `redact` to strip secrets (bearer tokens, keys,
  connection strings) from any logged text *before* it is stored, so a token can
  never reach the feed. `onChange` fires after every mutation with a fresh copy,
  which you wire to your SSE broadcast. The caller decides how to surface it
  (SSE snapshot, per-instance state, etc.).

- **`ui/commands-log` — `createCommandsLog(options)` (browser module).** The
  read-only panel that renders those records. It builds every node
  programmatically and inserts command text via `textContent`, so a logged
  command can never inject markup — the DOM does the escaping. The caller owns
  fetching/subscribing to state and calling `render()`. Load
  `ui/styles.css` and `ui/commands-log.css` in the consuming document.

## Azure resource icons

`@microsoft/canvas-toolkit/icons` owns the resource-type mapping and the bundled SVGs in
`src/icons/`. It does not depend on any example extension. These service marks
are separate from the general UI glyphs exported by `@microsoft/canvas-toolkit/ui/icons`.

```js
import { iconForType, azureIconAssets } from "@microsoft/canvas-toolkit/icons";

const key = iconForType("Microsoft.Web/sites", "functionapp,linux");
// key === "FunctionApp"

const staticFiles = new Map(azureIconAssets);
// "icons/FunctionApp.svg" -> [file URL, "image/svg+xml"]
```

Mount `azureIconAssets` alongside the canvas's other static assets, behind its
existing same-origin, token-scoped HTTP route. The file URLs are for the server
to read, not for the iframe to navigate to. Render the key as a relative image:

```html
<img src="./icons/FunctionApp.svg" alt="" aria-hidden="true">
```

`iconForType(type, kind)` is case-insensitive. It distinguishes Function Apps,
Logic Apps, Web Apps, Cosmos DB variants, and Foundry workspaces using `kind`
where ARM `type` is insufficient. Unknown types return `GENERIC_ICON`.
`BY_TYPE` exposes the direct type-to-key mappings; `azureIconAssets` also includes
kind-specific and catalog-only icons. Unknown asset routes are not registered.

SVGs stay in separate images so repeated icons do not introduce duplicate
gradient IDs into the document. The SVG bytes and mapping are packaged under
`src/`; no Azure request or external CDN is needed to obtain an icon.

## License

The toolkit is licensed under the [MIT License](LICENSE), following the Azure
extensions for VS Code. This includes the code, documentation, and bundled SVGs.
Include the copyright and permission notice when redistributing copies or
substantial portions of the software. Dependencies retain their own licenses.
This license applies to the toolkit package, not the entire source repository.

### Azure icon attribution

The service SVGs are from
[`microsoft/vscode-azureresourcegroups/resources/azureIcons`](https://github.com/microsoft/vscode-azureresourcegroups/tree/57d3edabac6881b1f3653e729b1611835bec8f7e/resources/azureIcons).
`Generic.svg` is the same repository's
[`resources/resource.svg`](https://github.com/microsoft/vscode-azureresourcegroups/blob/57d3edabac6881b1f3653e729b1611835bec8f7e/resources/resource.svg).
The type/kind disambiguation is adapted from
[`@microsoft/vscode-azureresources-api`'s `getAzExtResourceType`](https://github.com/microsoft/vscode-azureresourcegroups/blob/57d3edabac6881b1f3653e729b1611835bec8f7e/api/src/getAzExtResourceType.ts).

These upstream files are [MIT-licensed](https://github.com/microsoft/vscode-azureresourcegroups/blob/57d3edabac6881b1f3653e729b1611835bec8f7e/LICENSE.md).
Copyright (c) Microsoft Corporation. All rights reserved.
The copyright and MIT permission notice are retained in [LICENSE](LICENSE).

### Trademarks

Microsoft and Azure names, logos, and icons may be trademarks of Microsoft.
MIT licensing does not grant trademark rights. Use of Microsoft marks must
follow the [Microsoft Trademark and Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks)
and must not imply Microsoft sponsorship or endorsement.

## Testing your integration

Use an [injected credential](auth.md#explicit-credential-injection) and a
per-client fake HTTP transport for automated tests. The [examples](examples/README.md)
export functions that accept these dependencies without invoking the CLI.
For CLI-source tests, `@microsoft/canvas-toolkit/testing` exposes
`createTestAzureAuthSession` with an isolated source factory. Do not use that
test seam as production authentication configuration.

Do not use a developer's real identity or launch interactive sign-in from
ordinary tests. Live examples require explicit opt-in and a dedicated scope.
Use mocked tests for deterministic API behavior and live checks for the
authentication, permissions, and connectivity required by your application.
