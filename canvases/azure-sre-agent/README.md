# Azure SRE Agent

Diagnose failing Azure applications with an existing Azure SRE Agent. Select an
App Service, Function App, Container App, or another supported resource, start
an investigation, and continue working from the active thread.

## Install

In GitHub Copilot, go to **Customize → Canvases → Install from gist/URL** and
paste this URL:

`https://github.com/Azure/azure-dev-tools/tree/azure-sre-agent-latest/canvases/azure-sre-agent/extensions/azure-sre-agent`

The `latest` tag resolves to the currently approved version: 0.2.2 before
this candidate is promoted, and 0.2.3 only after approval, merge, and tagging.
To pin the 0.2.3 release to the exact reviewed bytes after promotion, use its
source-qualified versioned URL:

`https://github.com/Azure/azure-dev-tools/tree/azure-sre-agent-v0-2-3-0e5c4772/canvases/azure-sre-agent/extensions/azure-sre-agent`

The 0.2.3 versioned URL becomes available only after the candidate is approved,
merged, and tagged. Versioned tags are immutable. Use `latest` for approved
staging updates; use a versioned URL when a test or report must remain
reproducible.

Install, then fully quit and reopen GitHub Copilot. See the
[Azure SRE Agent README](https://github.com/Azure/azure-dev-tools/blob/azure-sre-agent-latest/canvases/azure-sre-agent/README.md)
for this quickstart and safety guidance.

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

Azure SRE Agent does not create the Azure SRE Agent resource. Discovery is
scoped to the selected subscription and to resources visible to your signed-in
Azure CLI identity.

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

When the canvas restores a connected agent, **Azure Configuration** collapses
to a summary with its name and resource group or external endpoint. It stays
expanded if no agent could be restored or a saved Favorite needs attention.

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

## Find and continue an investigation

For external agents, **Threads** shows up to 25 latest conversations; the
owned-agent thread listing is unchanged. Expand the compact **Threads** section
to choose a thread; collapse it to an icon-width rail when you need more space.
Use Enter or Space to reopen the rail. The selected thread remains highlighted,
long titles show their full text on hover, and the transcript scrolls
independently above Command activity and the version. These controls do not
change your Azure access.

## Save a connection

After connecting to a native Azure SRE resource or external agent, select
**Save connected agent** in **Azure Configuration**. Open **Favorites** to
reconnect to or remove a saved connection. Favorites are a user-local
preference in `~/.copilot/azure-sre-agent/favorites.json`, separate from the
last selection, and survive panel and extension restarts. At most 20
connections are stored. They contain only the native ARM identity or
external base endpoint and safe Portal link, never Azure credentials.
Reconnecting checks current Azure access; a failed or stale Favorite is not
silently removed.

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

## External agents and scheduled tasks

Registered external agents may expose a portal link and conversation threads
through validated `*.azuresre.ai` endpoints. Conversation requests use the
signed-in Azure CLI user's identity; a portal link is not a grant of access or
proof that every external-agent operation is supported. ARM-only actions are
not available for external agents.

Scheduled-task access is partial and depends on the selected agent and your
permissions. Do not assume that discovering an agent or viewing a task permits
creating, changing, or running scheduled tasks.

## Safety

- The extension uses your Azure CLI identity and never signs in for you.
- Native read and write actions are registered in the GitHub canvas. Mutations
  require an explicit panel action or host confirmation.
- Starting or continuing an investigation writes messages to an SRE Agent
  thread; review the action before selecting it or confirming it with the host.
- Access to agents, threads, and scheduled tasks depends on the signed-in
  user's permissions; subscription discovery or a registered external-agent
  portal link does not expand them.
- One-time execution authorization and durable Azure role assignment are
  separate operations. Neither should be inferred or combined automatically.
- Delegated Azure Data Explorer connector setup is preview functionality and
  separately requires `ALLOW_PRIVATE_CONNECTORS=true`; connector mutations
  require additional gating.
- The current delegated connector path must not be treated as private for
  production or multi-user use until the runtime can enforce verified,
  per-invocation user and thread ownership.

## Troubleshooting

- If the canvas is missing after installation, fully quit and reopen GitHub
  Copilot, start a fresh project chat, and retry the exact open prompt.
- Install from the nested `extensions/azure-sre-agent` URL above, not the
  package wrapper directory.
- If subscriptions or agents are absent, run `az account show`, verify the
  selected subscription and your agent permissions, then refresh the canvas.
- If a Favorite cannot reconnect, check the current resource, endpoint, and
  permissions. A malformed Favorites file surfaces an error rather than
  silently clearing saved entries.
- Resource Graph may not enumerate a subscription when you have access only to
  one agent. Use **Open an agent by URL or resource ID**, enter its Azure
  resource ID or `sre.azure.com` portal URL, and select **Connect to agent**.
- An external-agent portal link does not guarantee thread access: confirm
  that the endpoint is an accepted `*.azuresre.ai` host and that your Azure
  CLI user has permission to access its conversation threads.
- Do not install a second provider to work around stale registration. Disable
  retired or duplicate registrations, reinstall the canonical extension, and
  restart GitHub Copilot.
