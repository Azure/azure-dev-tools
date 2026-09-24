# __CANVAS_NAME__

A read-only Azure resource-group canvas. Each panel has its own subscription,
results and pending request.

## Connect the host entry

Have the installed `create-canvas` skill connect the copied `src/extension.mjs`.
Add:

```js
import { attachToolkit } from "./toolkit.mjs";
```

Wrap the existing options as `createCanvas(attachToolkit(nativeOptions))`.
Preserve metadata and session wiring. The adapter replaces demo callbacks and
chains close handling; customized callbacks need explicit integration.
The original native scaffold is unchanged.

## Build and run

Use Node.js 22+ (24 recommended) and a toolkit package with `/build`.

```sh
npm install
npm run build
npm test
npm run smoke
```

Keep the lockfile; use `npm ci` for later installs. `smoke` uses installed Chrome
or `CANVAS_BROWSER` with synthetic data. It does not download a browser or access
Azure. Build checks the host connection with a test SDK adapter.

Use the host skill to install the whole `dist/` and reload the provider. Reopen
the panel to verify the native app. A panel refresh does not restart the provider;
the UI warns when its files and provider have different build IDs.

## Read from Azure

With Azure CLI 2.61+ and an existing login, choose **Load profile**, select a
subscription, then **List resource groups**. The agent can call the same actions.
The app does not load a profile, sign in, choose scope or query automatically.
It never writes Azure resources.

Listings return ID, name and location, with limits of 200 rows / 10 pages.
Failures and cancellation are not reported as empty success. For a synthetic
walkthrough, open a separate panel with `{"mode":"fixture"}`; its labelled data
does not demonstrate live Azure access.

## Customize

| File | Purpose |
| --- | --- |
| `src/browser/` | UI, styles and subscription picker. |
| `src/resource-groups.mjs` | Azure reader copied from the toolkit example. |
| `src/domain.mjs` | Shared actions, scope, cancellation and stale-result checks. |
| `src/canvas.mjs` | Per-panel ownership, transport and assets. |
| `src/toolkit.mjs` | Native adapter and shutdown. |
| `scripts/build.mjs` | Node/browser builds, toolkit assets and build ID. |

Start with a local location filter, preserving raw IDs and loaded counts.
Keep the generated asset layout: bundling JavaScript alone does not copy icons.
Closing a panel or restarting the provider clears its state and cancels work;
browser reload keeps the open panel. Persistent storage and cloud writes need
separate designs.
