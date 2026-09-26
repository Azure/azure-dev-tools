# Azure Developer Tools

Build, explore, and troubleshoot Azure apps with focused tools for GitHub
Copilot.

## Explore

- [Azure Functions Hosted Skills](canvases/azure-functions-hosted-skills/README.md)
  builds and runs local Hosted Skills or invokes supported functions in Azure.
- [Azure Resources Query](canvases/azure-resources-query/README.md) finds Azure
  resources with read-only queries and adds selected results to chat.
- [Azure SRE Agent](canvases/azure-sre-agent/README.md) diagnoses failing apps
  with an existing Azure SRE Agent and keeps the investigation in one panel.
- [Canvas authoring](plugins/canvas-authoring/README.md) adds a skill-only
  companion for building canvas apps with the Microsoft Canvas Toolkit.

## Install

Open GitHub Copilot **Customize → Plugins**, use the marketplace gear to add
`Azure/azure-dev-tools` (ID `azure-dev-tools`), then install the product you
want. The CLI equivalent is:

```sh
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin install <product>@azure-dev-tools
```

The first three products install a canvas and companion skill.
`canvas-authoring` installs one skill only and does not install a canvas.
Each product guide includes prerequisites, a first run, exact-version
alternatives, and troubleshooting.

## Get involved

Watch this repository for updates and see [CONTRIBUTING.md](CONTRIBUTING.md)
to contribute. For help or feedback, see [SUPPORT.md](SUPPORT.md). To report
a security vulnerability, follow [SECURITY.md](SECURITY.md). This repository
is licensed under the [MIT License](LICENSE).
