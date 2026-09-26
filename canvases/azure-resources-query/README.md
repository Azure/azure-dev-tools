# Azure Resources Query

Find Azure resources with read-only Resource Graph queries, inspect results in
the panel, and add selected resources to chat without dumping an inventory.

![Azure Resources Query with the Resource Graph Explorer icon and a Function Apps in Development view, one resource selected, and Add to chat available. Synthetic fixture data only.](docs/resources-fixture.png)

*Example panel with sample resources, not your Azure data.*

## Install

Open GitHub Copilot **Customize → Plugins**, add `Azure/azure-dev-tools`
(ID `azure-dev-tools`), and install **Azure Resources Query 0.1.1**. The full
plugin includes the canvas and launcher skill:

```sh
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin install azure-resources-query@azure-dev-tools
```

Fully quit and reopen Copilot, then start a fresh chat. For an immutable tag or
canvas-only fallback, see [installation alternatives](docs/advanced.md). The
[latest README](https://github.com/Azure/azure-dev-tools/blob/azure-resources-query-latest/canvases/azure-resources-query/README.md)
tracks the published package documentation.

## Prerequisites

- A canvas-capable GitHub Copilot App with Node.js 22 or newer.
- Azure CLI 2.61 or newer on the extension provider's PATH.
- An Azure account with read access to the subscriptions and resource details
  you need. Sign in with `az login` or use **Azure connection > Sign in** in
  the canvas; opening it never signs in automatically.

## Try it

To open the panel without starting a query, ask exactly:

> Open the Azure Resources Query canvas.

To open it with a useful first query, ask:

> Show my Function Apps in Development.

1. **Confirm scope.** Ask for a list. Without a named subscription, choose
   **Continue** to confirm an eligible CLI default, or choose subscriptions in
   the panel. Nothing is preselected or silently accepted. A unique enabled
   named match can run immediately; ambiguous names require a choice.
   Confirmation runs the supplied query once. Cancel stops it.
2. **Inspect.** Click a resource name to see its query fields and read-only ARM
   details. Use **Back to results** to return. **Copy ID** and **Open in portal**
   are available per resource.
3. **Select.** Check individual resources or **Select loaded rows**. Selection
   applies to loaded rows, not every unseen result. Use **Load more** when
   available and review any incomplete-results warning.
4. **Add to chat.** Click **Add to chat** to share the selected resource context
   with Copilot. Selection is context, not permission to change those resources.

Then ask **Only those in West Europe** to refine the current view.

## What you can do

- Find Function Apps, VMs, storage accounts, and other Azure resources.
- Confirm subscription scope before a read-only Resource Graph query runs.
- Inspect resources and add selected rows to chat without pasting an inventory.

## Prompts to try

> Show my Function Apps in Development.

> Show storage accounts in Development, then filter to West Europe.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Azure CLI not found | Install Azure CLI 2.61+ and ensure `az` is on the provider's PATH, not just a terminal alias. Reload the host after correcting its environment. |
| Sign-in required or wrong account | Sign in explicitly, then **Reload CLI profile** after an external CLI change. **Refresh from Azure** is separate and can update the shared CLI profile. Neither runs KQL. |
| Permission denied | Check the account, tenant and selected subscriptions. Ask your administrator for the required read access; this canvas does not grant roles. An ARG result does not guarantee permission to read every resource's ARM details. |
| No matching subscriptions | Check the name/ID and enabled status. This is unresolved scope, not proof that there are no resources. |
| No results | Review the executed KQL, selected subscriptions and location criteria. Zero rows means no resources visible to your account matched this query; ARG can lag recent changes. |
| Panel missing or old panel reappears | Inspect the enabled provider, reload extensions once, and retry only if the canonical canvas is registered. An existing panel stays bound to its old provider; close it or use a fresh chat after correcting installation. |

See [advanced usage](docs/advanced.md) for query behavior, scope changes,
replacement, and rollback.
