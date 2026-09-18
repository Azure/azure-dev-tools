# Azure Functions Hosted Skills (preview-11)

Use this canvas to create and run a Hosted Skill locally with a Microsoft
Foundry model. It creates a local workspace from its bundled starter and uses
your Azure identity for model access. Exploring subscriptions and Function Apps
is read-only; workspace and local-host actions run only from the canvas and
protect existing or unowned folders.

## Before you begin

- Use a Copilot host with canvas extensions enabled.
- Install [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli).
- Sign in from a terminal with `az login`.
- Install Python and Azure Functions Core Tools when you want to run a local
  Function App.
- Ensure your Azure identity has access to the Microsoft Foundry project and
  model deployment you select.

Your Copilot host supplies the Node.js runtime needed by the canvas.

## Add the canvas

In the GitHub Copilot App, choose **Customize** and then **Add Canvas from
URL**. When this canvas is available at its public location, use:

```text
https://github.com/Azure/azure-dev-tools/tree/main/canvases/azure-functions-hosted-skills-preview-11/
```

Then ask Copilot:

```text
Open Azure Functions Hosted Skills (preview-11)
```

## Start a skill

<!-- HERO:OPEN -->
1. Open the canvas.
<!-- HERO:DOCTOR -->
2. Use **Doctor** to check Azure CLI sign-in and Azure Functions Core Tools.
<!-- HERO:WORKSPACE -->
3. The canvas creates a local workspace on first open. It copies its exact
   bundled starter into its dedicated workspace root without changing an
   existing or unowned folder. Use **New local function** to retry only after
   resolving an actionable creation error.
<!-- HERO:MODEL -->
4. Select a Microsoft Foundry subscription, project, and deployed model. If the
   project has no deployment, open **Create Models**, review the two factual
   model/version/capacity choices, and explicitly confirm the Azure change. The
   canvas uses your `az` login and RBAC, refreshes discovery, selects the
   created deployment, and configures it for the workspace.
<!-- HERO:CONFIGURE -->
5. Confirm the selected model summary. The canvas stores only the endpoint,
   deployment name, and optional managed identity client ID in local settings.
<!-- HERO:EDIT -->
6. Use **Edit instructions** to open `src/daily-repo-digest.agent.md`, or use
   **Open in VS Code** to open the complete workspace.
<!-- HERO:START -->
7. After model configuration, the canvas starts the local host and waits for it
   to report readiness. If it stops or reports an error, inspect the visible
   host output and use **Start local function** to retry after fixing the
   reported prerequisite or workspace problem.
<!-- HERO:INVOKE -->
8. Invoke the HTTP skill and inspect both the command
   output and agent response. Continue only when both show the expected result.
<!-- HERO:STOP -->
9. Stop the local host.
<!-- HERO:DEPLOYMENT -->
10. Use **Check deployment readiness** after a successful local invocation. The canvas
   checks for unsafe local configuration and tells you what managed identity and
   Microsoft Foundry access must be supplied by your Azure deployment setup.
<!-- HERO:HELP -->
11. Re-run **Doctor** whenever a step is blocked; it never reports ready while
    initialization or Foundry discovery is incomplete or failed.

## Help

If the canvas cannot find Azure CLI, confirm that it is available in the
environment where Copilot runs. If sign-in is required, run `az login` and try
again. For Azure CLI help, see
[sign in with Azure CLI](https://learn.microsoft.com/cli/azure/authenticate-azure-cli).
