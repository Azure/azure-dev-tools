# Azure Developer Tools

Azure Developer Tools is a home for tools that help developers work with Azure
through GitHub Copilot.

## Public staging

| Canvas | Package location | Status |
| --- | --- | --- |
| **Azure Functions Hosted Skills** | [`canvases/azure-functions-hosted-skills/`](canvases/azure-functions-hosted-skills/) | Candidate |
| **Azure Resources Query** | [`canvases/azure-resources-query/`](canvases/azure-resources-query/) ([install](docs/azure-resources-query/)) | Candidate |
| **Azure SRE Agent** | [`canvases/azure-sre-agent/`](canvases/azure-sre-agent/) | Candidate |

Candidate packages are staged for public review and validation; staging does
not constitute a production release. Follow the package README for its
installation requirements.

## Full plugins (staging)

After the marketplace is approved and published, open GitHub Copilot App
**Customize → Plugins**, use the marketplace gear to add the GitHub repository
`Azure/azure-dev-tools` once, and install each desired product from the
`azure-dev-tools` marketplace: `azure-sre-agent`,
`azure-functions-hosted-skills`, or `azure-resources-query`. Their CLI install
IDs are `<product>@azure-dev-tools`. Restart Copilot, open the canvas, and check
that its companion skills are available. The marketplace follows the current
public branch, not a pinned release; see [marketplace installation and
verification guidance](docs/plugin-marketplace.md) for the CLI path and
limitations.

## Get involved

Watch this repository for updates and see [CONTRIBUTING.md](CONTRIBUTING.md)
to contribute. For help or feedback, see [SUPPORT.md](SUPPORT.md). To report
a security vulnerability, follow [SECURITY.md](SECURITY.md). This repository
is licensed under the [MIT License](LICENSE).
