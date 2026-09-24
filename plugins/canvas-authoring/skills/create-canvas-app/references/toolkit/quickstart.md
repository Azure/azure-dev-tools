# Build your first Azure canvas

Create a read-only **Resource groups** app: select a subscription, list its
resource groups, then refresh the same view from the UI or your agent.

The fastest path uses the `create-canvas-app` companion's Azure starter.
The host's installed `create-canvas` skill handles native scaffolding and
activation; the companion adds toolkit setup.

## 1. Check prerequisites

- A canvas-capable GitHub Copilot host with its `create-canvas` skill.
- Node.js 22+ (24 recommended) and npm.
- A toolkit version with `@microsoft/canvas-toolkit/build`, or a compatible
  local `.tgz`. See [package setup](README.md#setup-and-exports).
- For live reads, Azure CLI 2.61+ on the provider's PATH and permission to
  read resource groups in your chosen subscription.

Install the companion from its public distribution:

```sh
copilot plugin install microsoft/azure-dev-tools:plugins/canvas-authoring
```

If the companion is unavailable, use the host skill and the
[manual integration map](#without-the-companion) below. If the host skill
itself is missing, use a host that provides it.

## 2. Ask your agent to create the app

```text
Build a Resource groups canvas with @microsoft/canvas-toolkit.
Use the native create-canvas skill and the companion's azure-resource-groups
starter. Confirm the new project location and compatible toolkit version.
Keep Azure reads explicit and share actions/state between the UI and agent.
Build it, verify it in the host, and show me how to add a location filter.
Do not create or modify Azure resources.
```

The agent generates the app and connects its copied native entry. You should
not need to choose libraries or write bundler configuration. The generated
README explains the connection and source files.

## 3. Build and open it

From the generated source app:

```sh
npm install
npm run build
npm test
npm run smoke
```

Keep the lockfile and use `npm ci` for later installs. The Azure starter's
`smoke` command uses installed Chrome or `CANVAS_BROWSER` with synthetic data;
it does not sign in to Azure or download a browser.

Have the host skill install the **complete `dist/` directory**, reload the
provider and open the panel. A standalone browser check is not proof of native
activation. A build-ID warning means the served files and provider differ;
refreshing only the panel will not reload the provider.

## 4. Read from Azure

If needed, sign in explicitly in a terminal with `az login`. In the panel:

1. Choose **Load profile**.
2. Select a subscription.
3. Choose **List resource groups**.

Opening the app does not sign in, select a default subscription or query Azure.
Profile metadata is not proof of resource access: a read may still fail because
of permissions or network access. Errors, cancellation and empty results are
shown separately.

The example returns only ID, name and location. It rejects incomplete listings
or results above 200 rows / 10 pages rather than silently hiding rows.

## 5. Make it your own

Start with a display-only location filter. Keep raw values and show both loaded
and displayed counts so filtering is not mistaken for a narrower Azure query.

| File | Change here |
| --- | --- |
| `src/browser/` | Labels, layout, display fields and local filters. |
| `src/resource-groups.mjs` | The copied [Azure reader](examples/resource-groups.mjs). Choose the target service's API, permissions and paging rules for another resource type. |
| `src/domain.mjs` | Shared actions, scope, request status and cancellation. |
| `src/canvas.mjs` | Per-panel lifecycle, transport and served assets. |

Keep the generated [UI asset layout](README.md#packaging-shared-ui) and
[shared styles](README.md#styling-and-themes). The build helper handles toolkit
icons; new app assets still need a build copy and a server route.

Before sharing the app, try:

| Check | Expected result |
| --- | --- |
| Ask the agent to refresh | The open panel updates through the same action and selected scope. |
| Cancel or change identity during a read | Old results cannot overwrite the new state. |
| Use keyboard, a narrow panel and another host theme | Controls and status stay usable; icons load. |
| Close and reopen | Pending work stops; the new panel starts without old scope or results. |

State is per-panel and temporary. Persistent storage and cloud writes need
their own design; do not add them by removing the starter's safeguards.

## Without the companion

Ask the host skill to create and open its smallest native canvas first. Then
use this map at its customization step:

- [Actions, state and server](README.md#canvas-skeleton): one validated dispatch
  for UI and agent callers, with credentials and Azure calls kept in Node.
- [Authentication](auth.md) and the
  [subscription selector](README.md#azure-subscription-selector): own one session,
  load metadata explicitly and bind a selected subscription.
- [Resource-group reader](examples/resource-groups.mjs): copy it into server
  source and pass a bound context and abort signal.
- [Packaging](README.md#packaging-shared-ui): separate Node/browser bundles,
  preserve asset paths and test the complete emitted app.

Implement `get_state`, `reload_profile`, `select_subscription`,
`list_resource_groups` and `cancel` through the shared registry. Keep scope
changes separate from queries, cancel old work and reject stale completions.
Dispose requests, listeners, the server and auth session with their owner.
Return to the host skill for native verification.
