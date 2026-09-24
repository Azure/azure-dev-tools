# Create canvas apps with the Canvas Toolkit

Build a canvas app with the Microsoft Canvas Toolkit. This skill-only plugin
adds toolkit setup and a counter or read-only Azure resource-group starter to
the GitHub Copilot app's native `create-canvas` workflow. It does not install
or start a canvas provider.

## Requirements

- A canvas-capable GitHub Copilot host with its installed `create-canvas` skill.
  The plugin does not replace or install that host skill.
- Node.js 22+ (24 recommended) and npm.
- Exact `@microsoft/canvas-toolkit@0.1.0-preview.2` from the public npm registry
  (with the `/build` export), or an approved compatible local `.tgz`.
- For live Azure reads: Azure CLI 2.61+ and permission to read the subscription.

## Install

Once a `canvas-authoring` release tag is published in
[`Azure/azure-dev-tools`](https://github.com/Azure/azure-dev-tools), check out
that tag and install the plugin from the checkout's root:

```sh
copilot plugin install ./plugins/canvas-authoring
```

The plugin is not yet listed in the `azure-dev-tools` marketplace. Once it
appears there, install it with:

```sh
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin install canvas-authoring@azure-dev-tools
```

See the [toolkit quickstart](skills/create-canvas-app/references/toolkit/quickstart.md)
for the Azure starter. Installing the plugin adds a skill, not a running
canvas app.

## Create an app

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
