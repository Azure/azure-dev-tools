# Azure Functions Hosted Skills Preview 3

This is an install-validation preview.

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
URL**. For this preview, use:

```text
https://github.com/Azure/azure-dev-tools/tree/functions-canvas-preview-3-validation/canvases/azure-functions-hosted-skills-preview-3/
```

Then ask Copilot:

```text
Open Azure Functions Hosted Skills Preview 3
```

## Start a skill

1. Open the canvas.
2. Use **Doctor** to check Azure CLI sign-in and Azure Functions Core Tools.
3. Choose a Microsoft Foundry endpoint and model deployment, then create a new
   local workspace. The canvas copies its bundled starter without changing an
   existing folder.
4. Configure the model for that workspace. The canvas stores only the endpoint,
   deployment name, and optional managed identity client ID in local settings.
5. Use **Edit instructions** to open `src/daily-repo-digest.agent.md`, or use
   **Open in VS Code** to open the complete workspace.
6. Start the local host, invoke the HTTP skill, and inspect both the command
   output and agent response. Continue only when both show the expected result.
7. Use **Prepare deployment** after a successful local invocation. The canvas
   checks for unsafe local configuration and tells you what managed identity and
   Microsoft Foundry access must be supplied by your Azure deployment setup.

## Help

If the canvas cannot find Azure CLI, confirm that it is available in the
environment where Copilot runs. If sign-in is required, run `az login` and try
again. For Azure CLI help, see
[sign in with Azure CLI](https://learn.microsoft.com/cli/azure/authenticate-azure-cli).
