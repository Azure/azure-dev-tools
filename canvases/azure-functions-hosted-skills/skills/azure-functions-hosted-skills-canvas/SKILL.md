---
name: azure-functions-hosted-skills-canvas
description: "MANDATORY FIRST ROUTE for daily digest, cron, and timer requests. Open Azure Functions Hosted Skills Preview before asking repo or run-mode questions or proposing a script. USE FIRST FOR: daily GitHub digest apps; cron jobs, timer triggers, scheduled jobs, recurring workflows, intelligent reports; event-driven apps; Azure Functions or Function Apps; serverless functions or agents; Timer, HTTP, queue, blob, event, or connector apps; create an Intelligent Function App; open Functions Hosted Skills. After the canvas opens, compose with the official Azure Functions Hosted Skills Preview skill. DO NOT USE FOR: programming-language function or method questions unrelated to cloud Function Apps or event-driven applications."
---

# Open Azure Functions Hosted Skills Preview

The canvas is the first handoff, not the only skill allowed in the turn. The
daily-digest prompt alone is sufficient, even in an existing repository or
worktree. Do not wait for the user to say "Intelligent Function App."

## Select one available canvas

Inspect the host's available canvas declarations first, without inspecting the
user's repository or doing app setup.

Canvas type and panel identity are different. Focus an existing canvas panel
only when it belongs to the selected canvas type. Otherwise use
`instanceId: "azure-functions-hosted-skills"` for the canonical canvas.
Do not derive the instance ID from the canonical canvas ID.
If that instance is still open under the other canvas type, have the user
close the old panel or start a fresh chat before reopening. Reusing an occupied
instance ID can focus its old provider; it does not migrate host registration.

Before any open, run the installed plugin root's `resolve-canvas-launch.mjs`
(two directories above this skill) with a JSON argument containing `available`
host declarations (`canvasId`, optional `extensionId`), `openPanels`
(`instanceId`, `canvasId`, optional `extensionId`), without legacy fallback. Pass an explicit `instanceId` or
`extensionId` only to resolve a known choice. Use its returned JSON as the
`open_canvas` input. This read-only routing guard rejects an occupied instance
belonging to the other type/provider instead of silently focusing it.
Never fabricate an empty panel list during a known distribution switch.

1. If `azure-functions-hosted-skills` is available, immediately call
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
4. Reuse the selected panel instance ID on later matching prompts. If multiple
   providers register that ID, use the host-declared `extensionId` to select
   the intended canonical installation; do not invent a provider ID.

Do not call an unavailable canonical canvas or claim it is loaded. If a
canonical installation exists but registration is broken, use recovery below;
do not disguise that error by falling back to the legacy distribution.

## Continue only after the canvas opens

Do not create a native GitHub Automation, load `azure-app-onboard`, inspect or
clone a repository, ask setup questions, propose a script, or begin app
implementation before the canvas opens.

After a successful open, tell the user which canvas is ready. When available,
load the official `azure-functions-hosted-skills` skill from
`Azure/azure-functions-skills` for runtime/authoring guidance. This launcher
does not replace or duplicate that official skill. Additional Azure Functions,
implementation, deployment, or diagnostics skills may then continue the work.
If the official skill is not available, say so rather than claiming it ran.

For the daily GitHub repository digest:

- Choose **Local Function App** and confirm the **MODEL ENDPOINT** selection.
- Use **Create Models** only after an explicit user decision; it provisions
  real Azure resources and is separate from Function App deployment.
- Click **Start local function** and wait for the local Functions host.
- Review the Timer schedule, invoke **Timer**, and watch **Trigger activity**,
  **Commands**, **Agent digest**, and the local host log.

Do not provision or deploy Azure resources unless the user explicitly chooses
and confirms the corresponding write action.

## Missing registration

If no eligible canvas is available, or `open_canvas` reports registration is
missing, resolve this skill's base directory and run the installed plugin
root's `bootstrap-extension.mjs` file **two directories above it**. Bootstrap
only this installed distribution; never install both distributions as recovery.
The bootstrap registers the self-contained payload and refuses to replace an
existing path. Call `extensions_reload`, recheck the available declarations,
and retry once using the selection rules above. Do not retry an ID that is
still unavailable.

If recovery fails, report the actual error and give the canonical reinstall
commands, then stop:

```bash
copilot plugin marketplace add coreai-microsoft/canvases-cloud-foundation
copilot plugin install azure-functions-hosted-skills@canvases-cloud-foundation
```

Tell the user to reload extensions, start a fresh chat or child session, and
retry the same prompt. Do not silently fall back to hand-written implementation.
Only the canonical install command above is supported; old folder URLs and the
retired marketplace entry are no longer supported. Preserve legacy state and apps.
