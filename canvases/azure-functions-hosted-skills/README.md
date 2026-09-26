# Azure Functions Hosted Skills

Build and run a local Hosted Skill, or invoke a supported function in an
existing Azure Function App. Start with a Timer, HTTP, or Queue trigger and
inspect its output in the canvas.

## Install

Open GitHub Copilot **Customize → Plugins**, add `Azure/azure-dev-tools`
(ID `azure-dev-tools`), and install **Azure Functions Hosted Skills 0.5.1**.
The full plugin includes the canvas and both launcher skills:

```sh
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin install azure-functions-hosted-skills@azure-dev-tools
```

Fully quit and reopen Copilot, then start a fresh chat. For an exact version
pin or canvas-only fallback, see
[installation alternatives](docs/advanced.md). The
[latest README](https://github.com/Azure/azure-dev-tools/blob/azure-functions-hosted-skills-latest/canvases/azure-functions-hosted-skills/README.md)
tracks the published package documentation.

## Prerequisites

- A GitHub Copilot environment that supports installing and opening canvas
  extensions.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
  installed and authenticated with `az login`.
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
  and Node.js.
- GitHub CLI (`gh`) signed in for the bundled repository-digest example.
- `uv` (preferred) or Python 3.13 or later. When `uv` is available, the canvas
  can provision the required Python version for the generated app.
- Azurite for the first local run.
- A compatible model in the current GitHub Copilot session, or access to an
  existing Microsoft Foundry deployment or governed Azure AI Gateway model.

Open **Doctor → Run Doctor** for a read-only check of the required tools,
Python package access, Azure CLI sign-in, and extension registration. Azure
Developer CLI (`azd`) is optional unless you choose **Create Models** or
**Deploy to Azure**.

## Try it

Ask exactly:

```text
Open Azure Functions Hosted Skills canvas
```

1. Select **Local Function App**. The canvas creates the bundled starter in
   `functions/daily-repo-digest` in the current worktree; use **Change** before
   creation to choose another subfolder.
2. In **Parameters JSON object**, keep
   `{"repository":"Azure/azure-functions-host"}` or replace it with an
   `owner/repo` value or GitHub repository URL.
3. Under **MODEL ENDPOINT**, keep the default **GitHub Copilot** provider and
   review the selected model. The canvas prefers GPT-5 mini when that model is
   available in the current session; otherwise it uses the first compatible
   model in the host-provided catalog. Choose **Microsoft Foundry** or
   **Azure AI Gateway** only when you want an Azure-backed model; those
   providers then require an Azure subscription.
4. Select **Start local function**. The canvas prepares an isolated Python
   environment, installs the app dependencies, starts Azurite when needed, and
   starts the local Functions host.
5. Select **Timer**, review the skill instructions, and select
   **Invoke Trigger**.
6. Review **Agent digest**, **Trigger activity**, **Commands**, and the
   **Local function host log**.

To invoke an existing app:

1. Select **Azure Function App**.
2. Choose the Azure subscription and Function App.
3. Select a discovered function. The canvas identifies whether its HTTP,
   Timer, or Storage Queue trigger has a supported invocation contract.
4. Enter optional test input and select **Invoke**.

## What you can do

- Build a repository-digest skill with a Timer, HTTP, or Queue trigger.
- Invoke a local trigger and inspect its digest, activity, commands, and logs.
- Select an existing Function App and confirm a supported remote invocation.

## Prompts to try

> Open Azure Functions Hosted Skills canvas and run Doctor before I build a
> local skill.

> Build a daily GitHub repository digest as a local Hosted Skill.

> Select an existing Azure Function App and help me test a supported function.

## Safety and authentication

- The extension uses your Azure CLI identity and never signs in for you.
- **Doctor** is read-only and never installs software or changes Azure.
- **Create Models** and **Deploy to Azure** create or change real Azure
  resources and require an explicit action in the canvas.
- **Invoke** can execute a local trigger or send real traffic to the selected
  Azure Function App. Review the target and input before invoking.
- Load testing sends throttled real HTTP traffic. It does not create, modify,
  scale, or deploy Azure resources, but it can affect the target workload.
- Generated app files are created in the selected subfolder. Removal stops if
  managed files were changed, to avoid deleting user work.

If the canvas is missing, fully quit and reopen Copilot, start a fresh project
chat, and retry the exact prompt. Run **Doctor** for specific fixes. Do not
install a second provider to work around stale registration. See
[advanced usage and troubleshooting](docs/advanced.md) for trigger behavior,
deployment safeguards, telemetry, and recovery.

## Learn more

- [Azure Functions Hosted Skills documentation](https://aka.ms/canvas-hostedskills-docs)
