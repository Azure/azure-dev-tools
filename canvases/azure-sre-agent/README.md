# Azure SRE Agent

Diagnose failing Azure applications with an existing Azure SRE Agent. Select an
App Service, Function App, Container App, or another supported resource, start
an investigation, and continue working from the active thread.

## Install

In GitHub Copilot, go to **Customize → Canvases → Install from gist/URL**,
paste the [stable Azure SRE Agent URL](https://github.com/Azure/azure-dev-tools/tree/azure-sre-agent-latest/canvases/azure-sre-agent/),
and install. Then fully quit and reopen GitHub Copilot.

Then ask:

```text
Open SRE Agent Canvas
```

## Prerequisites

- A GitHub Copilot environment that supports installing and opening canvas
  extensions.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
  installed.
- An authenticated Azure CLI session:

  ```bash
  az login
  ```

- Access to an Azure subscription containing an existing Azure SRE Agent.
- Permission to view and use that SRE Agent.

Azure SRE Agent does not create the Azure SRE Agent resource.

## Quickstart

1. Open **Azure SRE Agent**.
2. Expand **Azure Configuration**, choose the Azure subscription, and select an
   SRE Agent.
3. Open **Apps**.
4. Under **Quick diagnose a failing app**:
   - Choose the **App subscription**.
   - Select an app resource, or enter its resource name or ID.
   - Optionally add symptoms, error messages, or recent changes.
5. Select **Diagnose with SRE Agent**.

The canvas opens the resulting investigation under **Threads** and displays it
in **Active thread**. Use the transcript to inspect the agent's responses,
evidence, status, and tool activity.

### Example prompts

```text
Investigate this failure
```

```text
Investigate issues in <yourappname>
```

```text
Investigate why the Function App checkout-api started returning 503 responses after today's deployment.
```

Keep the symptom and resource name specific. The canvas adds the selected
resource and available Azure context when it starts the investigation.

## Continue an investigation

Select an existing thread, enter a follow-up in **Active thread**, and select
**Send**.

To use the same investigation from the main Copilot conversation:

1. Select **Focus this thread**.
2. Confirm the **Focused: _thread title_** badge appears.
3. Ask operational follow-up questions in the main conversation.
4. Return to **Active thread** to inspect the latest evidence and status.
5. Select **Unfocus** when you are finished.

Focus mode makes the focused thread the default destination for operational
follow-ups. It does not redirect every chat message: questions that can be
answered from already-loaded canvas data may still be answered locally.

## Safety

- The extension defaults to read-only operation. Actions that change Azure or
  SRE Agent state require explicit write enablement or host confirmation.
- Starting or continuing an investigation writes messages to an SRE Agent
  thread; review the requested action before approving it.
- One-time execution authorization and durable Azure role assignment are
  separate operations. Neither should be inferred or combined automatically.
- Delegated Azure Data Explorer connector setup is preview functionality.
  Connector mutations require additional gating.
- The current delegated connector path must not be treated as private for
  production or multi-user use until the runtime can enforce verified,
  per-invocation user and thread ownership.

## Learn more

- [Using Azure SRE Agent](https://github.com/coreai-microsoft/canvases-cloud-foundation/blob/main/docs/azure-sre-agent-usage.md)
- [Execution authorization safety contract](https://github.com/coreai-microsoft/canvases-cloud-foundation/blob/main/docs/sre-execution-action-contract.md)
- [Delegated connector safety and limitations](https://github.com/coreai-microsoft/canvases-cloud-foundation/blob/main/docs/sre-agent-private-connectors.md)
