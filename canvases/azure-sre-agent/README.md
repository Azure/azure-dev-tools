# Azure SRE Agent

Plugin for Copilot CLI with a canvas-capable host. Requires
Node 22 or later, Azure CLI with the user's existing sign-in, and an existing
Azure SRE Agent. No runtime npm install or repository checkout is required.
Packaging preserves the source app's bounded projection, focus, and
stale-state authorization contracts; packaging does not grant permissions or
enable actions.
The provider is read-only by default. Mutating actions and panel routes require
`ALLOW_WRITES=true`. Delegated private-connector mutations additionally require
`ALLOW_PRIVATE_CONNECTORS=true` and remain staging-disabled until the SRE
runtime supplies signed per-invocation user/thread ownership evidence.

The canonical provider, plugin, canvas, router, and launcher-skill identity is
`azure-sre-agent`; the visible product title is **Azure SRE Agent**.
Selection state is written under `~/.copilot/azure-sre-agent/` and migrates
read-only from the historical `~/.copilot/sre-agent-studio/` location.

The plugin includes the bundled provider and its launcher skill. Native plugin
discovery registers the provider; do not run the old source bootstrap script.
If registration fails, inspect the host's plugin and extension status, reload,
and report the actual error rather than installing another provider.

Try a short prompt:

- `Open SRE Agent Canvas`
- `Investigate this failure`
- `Investigate issues in <yourappname>`
- `Investigate why Function App orders-api returns 503 after deployment`

For an existing investigation, select a thread in **Threads** to inspect its
evidence and status in the **Active thread** pane. Choose **Focus this thread**
before operational follow-ups in chat, then choose **Unfocus** when finished.

Version comes only from the app package manifest. Checksums detect corruption;
they are not signatures or licensing/publication approval. Release approval is
maintained separately from these immutable package bytes.
