# Azure Resources Query

Find Azure resources in GitHub Copilot, inspect their details, and add a selected set to your conversation. Azure Resources Query runs read-only Azure Resource Graph (ARG) queries in the subscriptions you choose; results stay in a browsable panel instead of filling your chat with a table.

![Azure Resources Query with the Resource Graph Explorer icon and a Function Apps in Development view, one resource selected, and Add to chat available. Synthetic fixture data only.](docs/resources-fixture.png)

*Example panel with sample resources, not your Azure data.*

The product name and Resource Graph Explorer icon stay visible as you switch
queries; the current view's title appears underneath. The panel follows your
host theme.

## Install

### Install the full plugin

When the **azure-dev-tools** marketplace lists **Azure Resources Query**, open
**Customize > Plugins** in the GitHub Copilot App. Use the marketplace gear to
add `Azure/azure-dev-tools` (ID `azure-dev-tools`), then install **Azure
Resources Query** (`azure-resources-query`). This installs the full plugin:
the canvas and its launcher skill. Fully quit GitHub Copilot (not just the
chat or window), reopen the app, start a new chat, and ask exactly:

> Open the Azure Resources Query canvas.

Check **Plugin skills** for the Azure Resources Query launcher skill.
See the [latest Azure Resources Query README](https://github.com/Azure/azure-dev-tools/blob/azure-resources-query-latest/canvases/azure-resources-query/README.md)
for updates.

#### Optional: pin the full plugin to an exact version

From the [public tag list](https://github.com/Azure/azure-dev-tools/tags),
copy the complete immutable tag starting with `azure-resources-query-v0-1-1-`,
including its source qualifier. The `azure-resources-query-latest` tag moves
and is not an exact pin. Paste the versioned tag when prompted; this terminal
path installs the full plugin, including the launcher skill:

```sh
printf 'Paste the full versioned Azure Resources Query tag: '
read -r ARG_TAG
git clone --depth 1 --branch "$ARG_TAG" https://github.com/Azure/azure-dev-tools.git azure-resources-query-plugin
copilot plugin install ./azure-resources-query-plugin/canvases/azure-resources-query
```

Fully quit and reopen GitHub Copilot, start a new chat, use the open-canvas
prompt above, and check **Plugin skills**.

**Canvas-only fallback (no launcher skill):** If the full plugin is not listed,
choose **Customize > Canvases > Install from gist/URL** in the GitHub Copilot
App and paste the latest nested canvas extension URL:

```text
https://github.com/Azure/azure-dev-tools/tree/azure-resources-query-latest/canvases/azure-resources-query/extensions/azure-resources-query
```

This URL installs **only the canvas extension**, not the launcher skill. If
your team gave you a link to a specific version, use that link instead.
Install the folder containing `extension.mjs`, fully quit and reopen GitHub
Copilot, start a new chat, and use the open-canvas prompt above. Do not install
this fallback alongside the full plugin; duplicate providers can conflict.

### Prerequisites

- A canvas-capable GitHub Copilot App with Node.js 22 or newer.
- Azure CLI 2.61 or newer on the extension provider's PATH.
- An Azure account with read access to the subscriptions and resource details
  you need. Sign in with `az login` or use **Azure connection > Sign in** in
  the canvas; opening it never signs in automatically.

## Try it

Ask Copilot:

> Show my Function Apps in Development.

Then refine the same view:

> Only those in West Europe.

Or start another resource list:

> Show storage accounts in Development.

Replace **Development** with your subscription name or ID. You can also list Web Apps, VMs, or other resources supported by ARG. Copilot writes the KQL; **Query details** shows the exact query behind the displayed results.

## First run: scope, inspect, select, add to chat

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

Follow-up requests keep the current scope and refine the query. **Change**
lets you choose a different scope; **Apply** runs the current query in that
scope. **Rerun query** refreshes the displayed inventory. Sign-in/profile reload
does not rerun it automatically.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Azure CLI not found | Install Azure CLI 2.61+ and ensure `az` is on the provider's PATH, not just a terminal alias. Reload the host after correcting its environment. |
| Sign-in required or wrong account | Sign in explicitly, then **Reload CLI profile** after an external CLI change. **Refresh from Azure** is separate and can update the shared CLI profile. Neither runs KQL. |
| Permission denied | Check the account, tenant and selected subscriptions. Ask your administrator for the required read access; this canvas does not grant roles. An ARG result does not guarantee permission to read every resource's ARM details. |
| No matching subscriptions | Check the name/ID and enabled status. This is unresolved scope, not proof that there are no resources. |
| No results | Review the executed KQL, selected subscriptions and location criteria. Zero rows means no resources visible to your account matched this query; ARG can lag recent changes. |
| Panel missing or old panel reappears | Inspect the enabled provider, reload extensions once, and retry only if the canonical canvas is registered. An existing panel stays bound to its old provider; close it or use a fresh chat after correcting installation. |

## Replace or roll back

If you installed the complete plugin from a local checkout, follow your host's
local-plugin update instructions and keep the previous checkout until the new
one works. Do not mix files from different plugin versions. If you installed
the extension directly, close its panel and replace the **whole** extension
folder, not individual files; restore the previous whole folder to roll back.
Keep your saved views and do not delete `files/azure-resource-browser`.
