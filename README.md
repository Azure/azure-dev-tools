# Azure Developer Tools

Azure Developer Tools is a home for tools that help developers work with Azure
through GitHub Copilot.

## Install plugins (staging guidance)

After the marketplace is approved and published, open GitHub Copilot App
**Customize → Plugins**, use the marketplace gear to add the GitHub repository
`Azure/azure-dev-tools` once, and install each desired product from the
`azure-dev-tools` marketplace: `azure-sre-agent`,
`azure-functions-hosted-skills`, `azure-resources-query`, or `canvas-authoring`.
Their CLI install IDs are `<product>@azure-dev-tools`. The first three install
canvases and companion skills; after installation, ask Copilot to **Open Azure
SRE Agent**, **Open Azure Functions Hosted Skills**, or **Open Azure Resources
Query** by name. **canvas-authoring installs one skill only**, not a canvas to
open.

The App marketplace install is not yet verified. See [installation and release
gates](docs/plugin-marketplace.md) before attempting an install.

## Public staging

| Canvas | Package location | Status |
| --- | --- | --- |
| **Azure Functions Hosted Skills** | [`canvases/azure-functions-hosted-skills/`](canvases/azure-functions-hosted-skills/) | Candidate |
| **Azure Resources Query** | [`canvases/azure-resources-query/`](canvases/azure-resources-query/) ([install](docs/azure-resources-query/)) | Candidate |
| **Azure SRE Agent** | [`canvases/azure-sre-agent/`](canvases/azure-sre-agent/) | Candidate |

Candidate packages are staged for public review and validation; staging does
not constitute a production release. The marketplace follows the current
public branch, not a pinned release. Package READMEs document prerequisites
and a canvas-only URL fallback; that fallback does not install companion skills.

## Build canvas apps

The separate [`canvas-authoring` candidate](https://github.com/Azure/azure-dev-tools/tree/f0aeab8cbf7d64d0070045ee6c07dc083db01cd4/plugins/canvas-authoring) is a
**skill-only companion**, not a fourth canvas in the catalog above. Its
`create-canvas-app` skill requires the host's installed native `create-canvas`
skill to scaffold an app. Canonical npm publishes
`@microsoft/canvas-toolkit@0.1.0-preview.2` with a `/build` runtime and types
export; acceptance by a generated app has not yet been verified. The plugin
is a public staging candidate pending its product merge and immutable release
tag, so marketplace or App installation is not yet customer-ready.

## Get involved

Watch this repository for updates and see [CONTRIBUTING.md](CONTRIBUTING.md)
to contribute. For help or feedback, see [SUPPORT.md](SUPPORT.md). To report
a security vulnerability, follow [SECURITY.md](SECURITY.md). This repository
is licensed under the [MIT License](LICENSE).
