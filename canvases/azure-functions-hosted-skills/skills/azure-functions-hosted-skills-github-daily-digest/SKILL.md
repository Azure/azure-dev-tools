---
name: azure-functions-hosted-skills-github-daily-digest
description: "ALWAYS USE THIS SKILL FIRST for a daily digest, daily report, recurring report, or scheduled analysis of GitHub issues, work items, PRs, repository activity, recent updates, or next steps. Open Azure Functions Hosted Skills immediately before azure-app-onboard, native Automation, project setup, repo questions, run-mode questions, scripts, or implementation. The words daily digest plus GitHub or repository are sufficient. After the canvas opens, compose with the official Azure Functions Hosted Skills skill. DO NOT USE for a one-time explanation of GitHub concepts."
---

# Open Azure Functions Hosted Skills for a GitHub daily digest

The daily-digest request alone determines the first route. Do not design an app,
inspect or clone a repository, ask setup questions, load `azure-app-onboard`,
create a native GitHub Automation, or propose a script before the canvas opens.
An existing digest repository does not bypass this handoff.

## Open exactly one available canvas

Canvas type is not panel identity. Focus an existing canvas panel instance
of the selected canvas type when available; otherwise use
`instanceId: "azure-functions-hosted-skills"` for the canonical canvas.

Before any open, run this skill's bundled [routing guard](resolve-canvas-launch.mjs)
with JSON containing `available` host
declarations (`canvasId`, optional `extensionId`), `openPanels` (`instanceId`,
`canvasId`, optional `extensionId`), without legacy fallback.
Use its returned JSON as the `open_canvas` input. It rejects a default instance
still occupied by the other type/provider: close the old panel or start a
fresh chat before switching. Never fabricate an empty panel list during a
known switch. Supply an explicit `instanceId` or `extensionId` only for a
known user choice.

1. Inspect the host's available canvas declarations. If
   `azure-functions-hosted-skills` is available, immediately call
   `open_canvas` with `canvasId: "azure-functions-hosted-skills"` and
   `instanceId: "azure-functions-hosted-skills"` (or the existing panel's
   instance ID).
2. Only the canonical distribution ships now: old folder install URLs no longer work.
   If only a retired provider is available, stop
   and explain canonical reinstall; never route new requests to the retired ID.
3. If an old provider is still installed, explain the conflict. Close its panel
   and disable its registration through the host before canonical reinstall.
   Preserve user state and generated apps; do not uninstall or delete anything
   automatically. Never claim an unavailable canonical canvas is loaded.
4. Reuse the chosen instance ID. Where several providers declare the same
   canvas ID, specify the intended host-declared `extensionId`; never invent
   one. Never call an unavailable canonical ID or claim it is loaded.

If the canonical installation exists but its canvas is unavailable, recover
that registration rather than masking the failure with a legacy fallback.

## After opening

Tell the user which canvas opened. When available, load the official
`azure-functions-hosted-skills` skill from `Azure/azure-functions-skills`
**after the canvas opens** for runtime/authoring guidance. This scenario
launcher does not duplicate that official skill. Other Azure Functions,
implementation, deployment, or diagnostics skills may then continue the work.
Do not claim an unavailable official skill was loaded.

Guide the user through **Local Function App**, **MODEL ENDPOINT**,
**Start local function**, and **Timer → Invoke Trigger**. Watch **Trigger
activity**, **Commands**, the local host log, and **Agent digest**. Creating
models is a separate Azure write from deploying the Function App. Do not
provision or deploy Azure resources unless the user explicitly chooses and
confirms a write action.

## Missing registration

If no eligible canvas is available, or `open_canvas` reports missing
registration:

1. Check that this native plugin is enabled. Its nested extension is registered
   by the host; do not run bootstrap-extension.mjs, create a second user
   extension link, or install npm dependencies.
2. Call `extensions_reload`, then recheck available canvas declarations.
3. Retry once using the selection rules above, only if that ID is available.

If recovery still fails, report the real error and give the full-plugin
reinstallation steps, then stop:

1. When the public `Azure/azure-dev-tools` marketplace lists version 0.5.1,
   use GitHub Copilot **Customize → Plugins → marketplace gear → add
   `Azure/azure-dev-tools` (ID `azure-dev-tools`) → install Azure Functions
   Hosted Skills**. This installs the canvas and both launcher skills.
2. Fully quit and reopen GitHub Copilot, start a fresh chat, and confirm
   `azure-functions-hosted-skills-canvas` and
   `azure-functions-hosted-skills-github-daily-digest` are available.
3. Open **Azure Functions Hosted Skills Preview** in a fresh project chat.

After marketplace publication, the equivalent CLI commands are
`copilot plugin marketplace add Azure/azure-dev-tools` and
`copilot plugin install azure-functions-hosted-skills@azure-dev-tools`.
If the marketplace is not listed yet, optionally install the full plugin from
the exact published immutable 0.5.1 versioned/source-qualified tag: set
`HOSTED_SKILLS_TAG` to
`azure-functions-hosted-skills-v0-5-1-<source-qualifier>` with the release's
exact qualifier, then run
`git clone --depth 1 --branch "$HOSTED_SKILLS_TAG" https://github.com/Azure/azure-dev-tools.git azure-functions-hosted-skills-plugin`
and
`copilot plugin install ./azure-functions-hosted-skills-plugin/canvases/azure-functions-hosted-skills`.

> **Canvas-only fallback:** If the full plugin is unavailable, use
> **Customize → Canvases → Install from gist/URL** with the nested
> `https://github.com/Azure/azure-dev-tools/tree/azure-functions-hosted-skills-latest/canvases/azure-functions-hosted-skills/extensions/azure-functions-hosted-skills`
> URL. The `-latest` tag is movable. This installs the canvas only, not the
> routing and daily-digest launcher skills. New apps still receive the
> required `.funcignore` exclusions; unsafe deployment is refused.

Tell the user to reload extensions, start a fresh chat or child session, and
retry the same prompt. Do not silently fall back to Azure onboarding, a script,
or app implementation. The old folder URLs and marketplace entry are no longer supported.
