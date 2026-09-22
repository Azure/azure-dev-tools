---
name: azure-sre-agent-canvas
description: Open SRE Agent Canvas first for diagnosing a failing Azure app, correlating an ICM or S360 ticket, or operating Azure SRE Agent incidents, scheduled tasks, connectors, memories and workflows. Not for infrastructure implementation or unrelated KQL authoring.
---

# Open SRE Agent Canvas

Use this skill for diagnosing failing Azure apps and operating Azure SRE Agent resources (`Microsoft.App/agents`) — the same surface exposed by the Azure MCP Server's `sreagent_*` tools (agents, connectors, threads, investigations, incidents, scheduled tasks, memories, skills, and workflows).

When this skill is selected:

1. Immediately call `open_canvas` with:
   - `canvasId`: `azure-sre-agent`
   - `instanceId`: `azure-sre-agent`
2. Reuse that instance ID so a later matching prompt focuses the existing canvas instead of opening duplicate panels.
3. Do this even if the user only mentions a resource name, an ICM/S360 ticket id, or a vague "something's broken" - the canvas is the front door for those flows.
4. Do not replace the canvas with a generic explanation, generic Azure diagnostics session, or infrastructure implementation. Open SRE Agent Canvas first for failing-app diagnosis, ticket correlation, incident/investigation management, and SRE Agent operations.
5. Tell the user the canvas is open and guide them to select a subscription and SRE Agent, then either diagnose an app resource or paste an ICM/S360 ticket reference.
6. Leave infrastructure changes, deployment work, and non-SRE-Agent diagnostics to the general Azure skills unless the user explicitly asks for that work after the canvas handoff.

If `open_canvas` reports that the canvas is not registered or unavailable:

1. Inspect the host's plugin and extension status. The complete plugin declares its provider for native discovery; do not bootstrap a second source-folder provider.
2. If the plugin is enabled, call `extensions_reload`.
3. Retry `open_canvas` once with the same canvas and instance IDs.

Preserve existing installations and user state. Use a host-declared `extensionId`
when multiple providers are available; never guess a provider.

If the retry still fails, tell the user exactly how to reinstall, then stop:

```bash
copilot plugin marketplace add coreai-microsoft/canvases-cloud-foundation
copilot plugin install azure-sre-agent@canvases-cloud-foundation
```

Then tell them to reload extensions, start a fresh chat or child session, and retry the same prompt. Do not silently fall back to an unrelated generic diagnostics workflow.

## Prerequisites

The canvas drives Azure SRE Agent (`Microsoft.App/agents`) through the caller's own `az login` session, matching the setup for the Azure MCP Server's `sreagent_*` tools:

- Azure CLI installed and signed in (`az login`).
- For read-only/shared use, control-plane read access such as `Reader` or `Contributor`, plus `SRE Standard User`, on the target SRE Agent resource (or a parent scope).
- Additional SRE Agent administration or Azure resource roles are required only for corresponding write operations.
- An existing Azure SRE Agent resource in the subscription. The canvas cannot create the agent resource itself in v1 - point users to Azure portal / `az` if none exists yet.

If Azure Resource Graph cannot enumerate a resource-scoped share, use the
canvas's **Open a shared agent** field with the exact Azure resource ID or
`sre.azure.com` URL instead of treating an empty picker as proof of no access.

Reference: <https://techcommunity.microsoft.com/blog/appsonazureblog/access-your-sre-agent-from-any-ide-terminal-or-ai-assistant/4523434>
