# Azure Functions Hosted Skills Preview: key features

Azure Functions Hosted Skills Preview provides one authoring surface for local
development and for working with an existing Azure Function App.

## Local Function App

- Create and materialize a canvas-managed Function App, or attach an existing
  developer-owned Hosted Skills app without moving it or taking ownership.
- Discover `.agent.md` hosted skills for the selected trigger and choose the
  exact skill to author or test.
- Edit Markdown instructions with debounced autosave. Body-only edits preserve
  frontmatter; pasting a complete `.agent.md` document imports its frontmatter
  and body with revision-conflict protection.
- Render invocation parameters from each skill's `input_schema`.
- Use **Refresh** to reload VS Code or git edits from disk, and **Open in VS
  Code** for full-source editing. Invocation also refreshes the selected skill
  before resolving its route, parameters, and instructions.
- Bind a local Microsoft Foundry model, start or stop the Functions host,
  inspect host logs and activity, and invoke HTTP, Timer, or Queue skills.
  Timer testing uses an HTTP twin only when the relationship is deterministic.
- Deploy through the guided Azure workflow when the local app is ready.

## Azure Function App

- Discover subscriptions and existing Function Apps, then select the exact
  deployed function.
- Keep Azure target selection and refresh state separate from local source and
  model configuration.
- Invoke the selected deployed function when its trigger is supported and
  inspect bounded invocation activity. A deployed app might not return an
  agent response, so remote response capture is not guaranteed.

## Safe source and host lifecycle

- Pending instruction autosaves complete before supported source changes;
  unresolved editor conflicts block switching instead of overwriting disk.
- **Return to generated app** restores the preserved canvas-managed source
  without changing the attached developer-owned app.
- Attached paths are revalidated on reopen. Invalid paths fall back to the
  generated app with a visible explanation.
- Per-app host ownership prevents two canvas panels from controlling the same
  local Function App at the same time.
- Connector, Blob, and Cosmos DB triggers are not available. Load testing is
  not exposed in this canvas.

[Install and get started](README.md).
