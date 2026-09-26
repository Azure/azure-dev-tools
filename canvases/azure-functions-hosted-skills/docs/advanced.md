# Azure Functions Hosted Skills advanced usage

## Installation alternatives

To pin the full plugin to 0.5.1, use the exact published immutable,
source-qualified tag:

```sh
HOSTED_SKILLS_TAG=$(git ls-remote --refs --tags https://github.com/Azure/azure-dev-tools.git 'refs/tags/azure-functions-hosted-skills-v0-5-1-*' | awk '{sub(/^refs\/tags\//, "", $2); print $2}')
if [ "$(printf '%s\n' "$HOSTED_SKILLS_TAG" | grep -c '^azure-functions-hosted-skills-v0-5-1-')" -eq 1 ]; then
  git clone --depth 1 --branch "$HOSTED_SKILLS_TAG" https://github.com/Azure/azure-dev-tools.git azure-functions-hosted-skills-plugin &&
    copilot plugin install ./azure-functions-hosted-skills-plugin/canvases/azure-functions-hosted-skills
else
  echo "Expected exactly one published Hosted Skills 0.5.1 tag" >&2
fi
```

If the full plugin is unavailable, use **Customize → Canvases → Install from
gist/URL** with:

```text
https://github.com/Azure/azure-dev-tools/tree/azure-functions-hosted-skills-latest/canvases/azure-functions-hosted-skills/extensions/azure-functions-hosted-skills
```

The `-latest` tag can move. This fallback installs the canvas only, not the
routing or daily-digest launcher skills. Do not install it beside the full
plugin.

## Local and remote behavior

Switching Timer, HTTP, and Queue changes the selected view. It does not rewrite
the generated app or restart the local host. A new Queue skill is created when
you save its instructions, open it in VS Code, start the host, or invoke it.
Existing apps do not synthesize missing skills. Correct invalid Queue test
input before invoking.

**Open existing app…** accepts a local folder containing `host.json` and at
least one valid `.agent.md` file. Local Queue invocation writes only to
Azurite. Microsoft 365 Inbox invocation uses representative dry-run data and
does not call Outlook locally.

Remote invocation sends a real request or queue message to the selected Azure
resource. Unsupported trigger types remain unavailable rather than being
guessed. Remote response capture is not guaranteed; use trigger activity and
Application Insights to confirm the result.

## Deployment safeguards

A new generated app receives the bundled `src/.funcignore` exclusions even if
a URL installer omits the hidden template file. Deployment refuses a missing
or incomplete `.funcignore` in the deployment snapshot. Restore required
exclusions in an existing or attached app yourself; the canvas does not
overwrite your ignore-file edits.

## Troubleshooting

- Fully quit and reopen Copilot, start a fresh project chat, and retry the
  exact open prompt if the canvas is missing.
- Run **Doctor** for PATH, Python, Core Tools, Node.js, Azurite, Azure CLI
  sign-in, package-index access, and duplicate-installation checks.
- If Azure resources or models are absent, run `az account show`, confirm the
  subscription and permissions, then refresh.
- Preserve generated apps and state. Disable retired or duplicate
  registrations, reinstall the canonical extension, and restart Copilot.

## Product-usage telemetry

Product-usage telemetry is disabled by default. When explicitly configured,
the canvas enqueues only code-defined action, outcome, and panel-control
metadata. Delivery is asynchronous, bounded, memory-only, and
Entra-authenticated. Prompts, inputs, outputs, resource IDs, repository names,
URLs, paths, commands, raw errors, tokens, and secrets are excluded. Telemetry
failures never alter an action result.
