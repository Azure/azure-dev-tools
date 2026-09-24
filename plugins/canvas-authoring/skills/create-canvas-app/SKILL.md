---
name: create-canvas-app
description: Create a canvas app with the native create-canvas skill and Microsoft Canvas Toolkit. Includes counter and read-only Azure resource-group starters.
---

# Canvas toolkit companion

**First action:** invoke the host's installed `create-canvas` skill with
`skill({ skill: "create-canvas" })`. If already active, continue that invocation.
It is the source of truth for native scaffolding, SDK registration, lifecycle,
scope and activation. Follow its workflow, including its **native scaffold step**.
Apply this companion at the customization/build step, then return to that
workflow for verification. If unavailable, report that the required app skill
is missing; do not invent a replacement host workflow.

## 1. Choose the starter and package

For Azure requests, use `--template azure-resource-groups`. It already includes
auth, explicit subscription selection, a bounded reader, cancellation, shared
UI/agent state and the subscription picker. Do not generate a counter and
rebuild this wiring. Omit the template option for a generic counter.

Confirm one compatible toolkit source: an exact published npm version with
`/build`, or a local npm-pack tarball. Do not invent a published version, use
tags/ranges, publish a package, or switch sources after a failed installation.

Use the host-created canvas ID and `extension.mjs`. Its directory must contain
only that file. Choose a separate, new source-app directory under an existing
parent. Resolve symlinks in input/output paths first; setup rejects them and
does not merge existing projects.

## 2. Generate the source app

From this installed skill's directory, replace the placeholders:

```sh
node scripts/setup-toolkit.mjs --name my-canvas \
  --scaffold "<native-scaffold>/extension.mjs" \
  --output "<existing-parent>/my-canvas-source" \
  --toolkit-version "<exact-version>" \
  --template azure-resource-groups
```

Alternatively, replace `--toolkit-version` with
`--toolkit-tarball "<toolkit-package>.tgz"`. Choose exactly one.

Setup copies the native entry unchanged and creates the app's package, source,
assets and build checks. It performs no install, sign-in or resource read.
It refuses any existing destination, including identical output. Registry mode
is offline until `npm install`; an incompatible installed package fails build.
The Azure template requires the full exported plugin, including bundled guides.

## 3. Connect and build

Follow the generated README to import `attachToolkit` into the copied
`src/extension.mjs` and wrap the existing `createCanvas` options. Preserve native
metadata and session wiring. The adapter replaces scaffold demo callbacks and
chains close handling; custom callbacks or shutdown handlers need explicit
integration. Do not create a second provider.

```sh
npm install
npm run build
npm test
```

For Azure, also run `npm run smoke` with installed Chrome or `CANVAS_BROWSER`.
Do not download a browser automatically. Keep checks scoped to the generated
app during iteration, and retain its lockfile for later `npm ci`.

Source generation alone is NOT READY. Build checks the emitted host entry's
registration and toolkit connection using a test SDK adapter. This executes
trusted code; it is not native-host activation. Return to the host skill to
install the whole `dist/`, reload the provider and verify the actual panel.

## 4. Customize without changing the contracts

- UI and agent calls use the same validated actions and state. No raw prompt
  forwarding or separate chat-only Azure implementation.
- Azure mode is lazy: no profile read, login, default subscription selection,
  resource query or cloud write on open. Each panel owns its scope and results.
- Keep credentials server-side, cancel obsolete work and reject stale results.
  Empty success, missing scope, errors and cancellation must remain distinct.
- Use labelled `{"mode":"fixture"}` data for tests. Do not report it as live Azure.
- Keep the generated build's dependencies and asset layout. Check decoded
  images as well as controls; do not replace missing assets with SVG rewrites.
- State is ephemeral. Follow the host skill for persistence and shutdown.
  A panel refresh is not a provider reload; check the displayed build ID.

Use the [integration reference](references/toolkit.md) for adapter/build details
and the [Azure quickstart](references/toolkit/quickstart.md) for customization.
Toolkit guide links are assembled in the exported plugin, not maintained as
copies in the source tree. Installation, publication and cloud mutations remain
separate user decisions.
