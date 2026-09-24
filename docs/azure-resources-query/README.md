# Install Azure Resources Query

Azure Resources Query lets you find Azure resources in GitHub Copilot, inspect
read-only details, and add selected resources to chat without filling the
conversation with an inventory table.

## Install

### Install the full plugin

When the **azure-dev-tools** marketplace lists **Azure Resources Query**, open
**Customize > Plugins** in the GitHub Copilot App. Use the marketplace gear to
add `Azure/azure-dev-tools` (ID `azure-dev-tools`), then install **Azure
Resources Query** (`azure-resources-query`). This installs the full plugin:
the canvas and its launcher skill. Fully quit GitHub Copilot (not merely the
chat or window), reopen the app, start a new chat, and ask exactly:

> Open the Azure Resources Query canvas.

Check **Plugin skills** for the Azure Resources Query launcher skill.

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

**This URL installs only the canvas extension**, not the launcher skill. If
your team gave you a link to a specific version, use that link instead.
Install the directory containing `extension.mjs`, fully quit and reopen
GitHub Copilot, start a new chat, and use the open-canvas prompt above. Do
not install this fallback alongside the full plugin; duplicate providers
can conflict.

## Prerequisites

- A canvas-capable GitHub Copilot App that provides Node.js 22 or newer.
- Azure CLI 2.61 or newer available on the extension provider's PATH.
- An Azure account signed in via `az login` (or **Azure connection > Sign in**)
  with read access to the subscriptions and details you want. Opening the
  canvas does not initiate sign-in.

## Quickstart

1. **Confirm scope.** Ask "Show my Function Apps in Development." Replace
   Development with your subscription name or ID. Choose **Continue** to
   confirm an eligible CLI default, or choose subscriptions in the panel;
   ambiguous names need a choice. Cancelling stops the query.
2. **Inspect.** Click a resource name to inspect query fields and read-only ARM
   details. Use **Back to results** to return. **Query details** shows the
   exact KQL Copilot ran.
3. **Select.** Check individual resources or **Select loaded rows**. Use
   **Load more** for more results; selection covers only loaded rows.
4. **Add to chat.** Click **Add to chat** to share selected resource context,
   not permission to change Azure resources.

Use **Change** and **Apply** to rerun with a different subscription scope.
**Rerun query** refreshes the inventory. Sign-in or profile reload does not
rerun queries automatically.

## Troubleshooting and safety

| Symptom | What to check |
| --- | --- |
| Canvas missing after installation | Fully quit and reopen the host, verify the nested extension folder and enabled provider, then use a fresh chat if an old panel is still bound to an earlier provider. |
| Azure CLI not found | Install Azure CLI 2.61+ and make `az` available on the provider's PATH, not only as a shell alias; restart the host after changing PATH. |
| Sign-in or account mismatch | Sign in explicitly, then use **Reload CLI profile** to read external CLI changes. **Refresh from Azure** can update the shared CLI profile; neither action runs KQL. |
| Permission denied or missing subscriptions | Check account, tenant, enabled subscription and read access. This canvas cannot grant roles; unresolved scope is not an empty resource list. |
| No results | Check the executed KQL and selected scope. Azure Resource Graph can lag recent changes; an ARG result does not guarantee access to every resource's ARM details. |

The canvas only reads Azure resources. Your saved views stay in this session;
keep `files/azure-resource-browser` when updating or rolling back.
