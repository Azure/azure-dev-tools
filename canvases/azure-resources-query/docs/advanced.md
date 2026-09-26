# Azure Resources Query installation alternatives and advanced usage

## Pin the full plugin to 0.1.1

From the [public tag list](https://github.com/Azure/azure-dev-tools/tags), copy
the complete immutable tag starting with
`azure-resources-query-v0-1-1-`, including its source qualifier:

```sh
printf 'Paste the full versioned Azure Resources Query tag: '
read -r ARG_TAG
git clone --depth 1 --branch "$ARG_TAG" https://github.com/Azure/azure-dev-tools.git azure-resources-query-plugin
copilot plugin install ./azure-resources-query-plugin/canvases/azure-resources-query
```

The `azure-resources-query-latest` tag can move and is not an exact pin.

## Canvas-only fallback

If the full plugin is unavailable, open **Customize → Canvases → Install from
gist/URL** and install:

```text
https://github.com/Azure/azure-dev-tools/tree/azure-resources-query-latest/canvases/azure-resources-query/extensions/azure-resources-query
```

This installs only the canvas extension, not the launcher skill. Fully quit
and reopen Copilot, then use **Open the Azure Resources Query canvas.** Do not
install the fallback beside the full plugin because duplicate providers can
conflict.

## Query and scope behavior

Replace **Development** in example prompts with a subscription name or ID. You
can list Web Apps, VMs, storage accounts, or other resources supported by Azure
Resource Graph. Copilot writes the KQL; **Query details** shows the exact query
behind the displayed results.

Follow-up requests keep the current scope and refine the query. **Change** lets
you choose a different scope; **Apply** runs the current query in that scope.
**Rerun query** refreshes the displayed inventory. Sign-in or profile reload
does not rerun it automatically.

The product name and Resource Graph Explorer icon stay visible as you switch
queries. The current view title appears underneath, and the panel follows the
host theme.

## Replace or roll back

For a full plugin installed from a local checkout, follow the host's
local-plugin update instructions and keep the previous checkout until the new
one works. Do not mix files from different versions.

For a directly installed extension, close its panel and replace the whole
extension folder, not individual files. Restore the previous whole folder to
roll back. Preserve saved views and do not delete
`files/azure-resource-browser`.
