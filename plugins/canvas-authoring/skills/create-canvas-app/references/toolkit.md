# Toolkit integration reference

This page covers the companion's host adapter and build settings. For general
APIs, use the bundled [toolkit reference](toolkit/README.md); those guides are
assembled when the plugin is exported.

## Connect the native scaffold

The [setup command](../scripts/setup-toolkit.mjs) copies the host entry without
editing the original. In the copied `src/extension.mjs`, add:

```js
import { attachToolkit } from "./toolkit.mjs";
```

Wrap the existing declaration as `createCanvas(attachToolkit(nativeOptions))`.
Keep its metadata, full host context and surrounding session wiring. The
adapter replaces the scaffold's demo actions/open callback and runs the native
close callback after toolkit cleanup. Do not attach it over custom business
callbacks or competing shutdown handlers without adapting their ownership.

`npm run build` includes the registration check; `npm run check` repeats it
without building. It executes the emitted entry with a test SDK adapter and
checks action/open/close behavior. Missing hookup, unused imports and conflicting
shutdown handlers fail. The adapter used by the test stays outside `dist/`.
Native activation is a separate check owned by the installed host skill.

## Choose the toolkit dependency

Use one exact npm version with `/build`, or a local tarball. Setup is offline;
registry mode resolves the chosen version during `npm install`. Local mode
copies the archive to `vendor/canvas-toolkit.tgz` and uses
`file:vendor/canvas-toolkit.tgz`. Keep the lockfile, avoid absolute dependencies,
and do not commit private tarballs.

Bundled guide versions and checksums do not establish npm availability.
An unavailable version must fail installation, not trigger a source fallback.

## Reuse the public APIs

| API | Guidance |
| --- | --- |
| `@microsoft/canvas-toolkit/actions` | [Validate inputs once](toolkit/README.md#canvas-skeleton); UI requests and host actions call the same dispatch. |
| `@microsoft/canvas-toolkit/state` | The optional store is in-memory, not durable persistence. Choose ownership through the host lifecycle. |
| `@microsoft/canvas-toolkit/server` | [Serve the app](toolkit/README.md#canvas-skeleton) through the shared loopback transport, with an explicit asset allowlist. |
| `@microsoft/canvas-toolkit/ui/styles.css` | [Use shared styles](toolkit/README.md#styling-and-themes) and link the emitted CSS from HTML. |
| Azure auth/subscriptions | [Bind explicit scope](toolkit/auth.md) and keep credentials in Node. These helpers are optional for non-Azure apps. |

`effect: "write"` describes an action; it does not authorize a cloud mutation.
Keep errors visible and discard results from cancelled or invalidated contexts.

## Preserve the build layout

The generated build uses
[`prepareCanvasUiAssets`](toolkit/README.md#packaging-shared-ui) to copy shared
UI files and supply bundler paths. Keep these settings when customizing:

| Output | Required boundary |
| --- | --- |
| Node provider | Emit at the `dist/` root. Keep `@github/copilot-sdk/extension` external, along with Node built-ins and explicitly emitted local modules. Bundle other used npm code. |
| Browser entry | Serve at the canvas URL root. No Node or host SDK imports; link compiled CSS separately. |
| Shared UI | Preserve the helper's `nodeImport` filesystem path and `browserImports` URL paths. Mount the full `canvasUiAssets` map through the server. |
| App assets | Copy HTML and custom assets into `dist/` and add their server routes. The helper only copies toolkit UI assets. |

Do not externalize all dependencies or flatten asset-owning modules: esbuild
does not copy `new URL(..., import.meta.url)` assets automatically. Preserve
same-origin URLs under the canvas prefix and the existing CSP. Native modules,
dynamic imports and runtime file lookups may need additional build handling.

Check a relocated `dist/` without source dependencies. Asset checks should
include successful image decoding and HTTP errors, not just working buttons.
Reload the provider after rebuilding; a panel refresh alone does not replace it.
