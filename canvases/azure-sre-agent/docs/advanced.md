# Azure SRE Agent installation alternatives and operational notes

## Pin the full plugin to 0.2.4

Use the published, source-qualified immutable tag for a reproducible full-plugin
install:

```sh
SRE_TAG=$(git ls-remote --refs --tags https://github.com/Azure/azure-dev-tools.git 'refs/tags/azure-sre-agent-v0-2-4-*' | awk '{sub(/^refs\/tags\//, "", $2); print $2}')
if [ "$(printf '%s\n' "$SRE_TAG" | grep -c '^azure-sre-agent-v0-2-4-')" -eq 1 ]; then
  git clone --depth 1 --branch "$SRE_TAG" https://github.com/Azure/azure-dev-tools.git azure-sre-agent-plugin &&
    copilot plugin install ./azure-sre-agent-plugin/canvases/azure-sre-agent
else
  echo "Expected exactly one published SRE 0.2.4 tag" >&2
fi
```

If zero or multiple tags match, stop and inspect the
[published tags](https://github.com/Azure/azure-dev-tools/tags). The
`azure-sre-agent-latest` tag can move and does not pin a version.

## Canvas-only fallback

If the full plugin is unavailable, open **Customize → Canvases → Install from
gist/URL** and install:

```text
https://github.com/Azure/azure-dev-tools/tree/azure-sre-agent-latest/canvases/azure-sre-agent/extensions/azure-sre-agent
```

This installs the canvas only, not the `azure-sre-agent-canvas` routing skill.
Fully quit and reopen Copilot. If the prompt does not route, open **Azure SRE
Agent** from installed canvases. Do not install a second provider to work
around a missing canvas.

## Use and safety

Choose the subscription and SRE Agent in **Azure Configuration**, then use
**Apps** to diagnose a failing resource. Select a thread in **Threads** to
inspect its evidence and status in **Active thread**. Choose **Focus this
thread** before operational follow-ups in chat, then **Unfocus** when finished.

The canvas uses your Azure CLI identity. Its read and write actions are
registered; mutating operations require an explicit action or host
confirmation. One-time execution authorization is separate from durable role
assignment. Delegated private-connector mutations require
`ALLOW_PRIVATE_CONNECTORS=true` and must not be used for production or
multi-user private connector isolation without verified per-invocation
ownership.

If agents do not appear, check `az account show`, the selected subscription,
and your permissions. If the canvas is missing, check plugin and extension
status, reinstall through the same path, fully quit Copilot, and retry in a
fresh chat.
