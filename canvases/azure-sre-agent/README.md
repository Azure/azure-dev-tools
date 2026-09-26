# Azure SRE Agent

Diagnose a failing Azure app with an existing SRE Agent, inspect the resulting
investigation, and continue from its active thread.

## Install

Open GitHub Copilot **Customize → Plugins**, add `Azure/azure-dev-tools`
(ID `azure-dev-tools`), and install **Azure SRE Agent 0.2.4**. The full plugin
includes the canvas and its `azure-sre-agent-canvas` routing skill:

```sh
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin install azure-sre-agent@azure-dev-tools
```

Fully quit and reopen Copilot, then start a fresh chat. For an exact version
pin or canvas-only fallback, see
[installation alternatives](docs/advanced.md). The
[latest README](https://github.com/Azure/azure-dev-tools/blob/azure-sre-agent-latest/canvases/azure-sre-agent/README.md)
tracks the published package documentation.

## Prerequisites

- A Copilot host that supports the installation path you choose and Node 22
  or later.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
  installed and signed in with `az login`.
- Access to an Azure subscription containing an existing Azure SRE Agent, with
  permission to view and use it. This plugin does not create the agent resource.

## Try it

Ask exactly:

```text
Open SRE Agent Canvas
```

1. Open **Azure SRE Agent** with the prompt above.
2. Expand **Azure Configuration**, choose the subscription, and select your
   SRE Agent.
3. Open **Apps**.
4. Under **Quick diagnose a failing app**, choose the **App subscription** and
   select an app resource or enter its resource name or ID. Add symptoms if
   available.
5. Select **Diagnose with SRE Agent**. Inspect the resulting investigation
   under **Threads** in **Active thread**.

## What you can do

- Find an existing SRE Agent and the apps it monitors.
- Diagnose a failing app and review investigation threads with their evidence.
- Focus an active thread to continue the investigation in chat.

## Prompts to try

> Open SRE Agent Canvas and show me my SRE Agents.

> Open SRE Agent Canvas so I can choose a failing app and diagnose it with my
> SRE Agent.

> Investigate why Function App orders-api returns 503 after deployment.

## Safety and troubleshooting

The canvas uses your Azure CLI identity. Mutating operations require an
explicit action or host confirmation. Review the selected subscription, agent,
app, and action before continuing.

If the canvas is missing, fully quit and reopen GitHub Copilot, start a fresh
chat, and retry the exact prompt. Check plugin and extension status rather
than installing a second provider; reinstall via the same path you chose
(canvas extension or full plugin). If agents do not appear, run
`az account show` and check your selected subscription and agent permissions.
See [operational notes](docs/advanced.md) for complete safety guidance.
