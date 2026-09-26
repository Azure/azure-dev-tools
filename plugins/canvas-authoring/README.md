# Canvas authoring plugin

Create a canvas app with the Microsoft Canvas Toolkit. This **skill-only
companion** adds toolkit setup and a counter or read-only Azure resource-group
starter to the host's native `create-canvas` workflow. It does not install or
start a canvas.

## Install

Open GitHub Copilot **Customize → Plugins**, add `Azure/azure-dev-tools`
(ID `azure-dev-tools`), and install **canvas-authoring 0.1.0**:

```sh
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin install canvas-authoring@azure-dev-tools
```

For a reproducible local install, check out the immutable
`canvas-authoring-v0-1-0-23aa6b1` tag and install its plugin directory:

```sh
git clone --depth 1 --branch canvas-authoring-v0-1-0-23aa6b1 https://github.com/Azure/azure-dev-tools.git canvas-authoring-plugin
copilot plugin install ./canvas-authoring-plugin/plugins/canvas-authoring
```

Installing this package contributes the `create-canvas-app` skill. It does not
install a canvas extension or replace the host's native `create-canvas` skill.

## Requirements

- A canvas-capable GitHub Copilot host with its installed `create-canvas` skill.
  The plugin does not replace or install that host skill.
- Node.js 22+ (24 recommended) and npm.
- Exact `@microsoft/canvas-toolkit@0.1.0-preview.2` from the public npm registry
  (with the `/build` export), or an approved compatible local `.tgz`.
- For live Azure reads: Azure CLI 2.61+ and permission to read the subscription.

See the [toolkit quickstart](skills/create-canvas-app/references/toolkit/quickstart.md)
for the Azure starter. Installing the plugin adds a skill, not a running
canvas app.

## Try it

Ask your agent:

```text
Build a read-only Azure canvas that lists resource groups.
Use the native create-canvas skill and the create-canvas-app companion's
Azure starter. Help me choose a compatible toolkit version.
```

The agent creates the native scaffold, generates the source app, and connects
the copied host entry. You choose the project location and toolkit package.
For a non-Azure example, ask for the counter starter.

Setup accepts one exact npm version or one local tarball. For the published
package, pass `--toolkit-version 0.1.0-preview.2` to the
[setup command](skills/create-canvas-app/SKILL.md#2-generate-the-source-app).
It does not install dependencies or contact Azure, and it refuses existing
output directories rather than overwriting files.

## What you can do

- Generate a native canvas scaffold with a working counter starter.
- Start a read-only Azure resource-group viewer with explicit subscription
  choice.
- Build and smoke-test the generated app before installing its complete output.

## Prompts to try

> Use the native create-canvas skill and the create-canvas-app companion to
> build a counter canvas.

> Build a read-only Azure canvas that lists resource groups. Use the native
> create-canvas skill and the create-canvas-app companion's Azure starter.

## Build and run

In the generated app using `@microsoft/canvas-toolkit@0.1.0-preview.2`:

```sh
npm install
npm run build
npm test
npm run smoke
```

If your configured npm feed has not synchronized this version, use
`npm install --registry=https://registry.npmjs.org/` for that install only;
do not change global npm configuration.

`smoke` is available in the Azure starter. It uses installed Chrome, or the
executable specified by `CANVAS_BROWSER`, with labelled synthetic data.
Keep `package-lock.json` and use `npm ci` for later installs.

Follow the generated README and host skill to install the complete `dist/`
directory and reload the provider. A browser refresh does not load rebuilt
provider code; a build-ID warning indicates a mismatch.

The Azure app does nothing until you act: load the CLI profile, select a
subscription, then choose **List resource groups**. It never signs in, chooses
a subscription, or writes Azure resources automatically. Browser checks do not
replace trying the app in the native host with your Azure account.

## Customize

Start with the generated README's source map and the
[Azure quickstart](skills/create-canvas-app/references/toolkit/quickstart.md).
Keep the shared UI/agent actions, explicit scope and cancellation when changing
the reader or display. The [integration reference](skills/create-canvas-app/references/toolkit.md)
covers the host adapter and build settings.

Toolkit guides are included in the plugin and generated from the toolkit
sources. Their [provenance](skills/create-canvas-app/references/toolkit/provenance.json)
records versions and checksums; it does not establish npm availability.
