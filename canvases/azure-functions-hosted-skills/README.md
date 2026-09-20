# Azure Functions Hosted Skills Preview

Build, run, test, and deploy Azure Functions Hosted Skills from a canvas-enabled
GitHub Copilot host.

## Install the preview

> **Temporary staging URL:** This will be replaced with the production URL
> later.

1. Copy
   `https://github.com/coreai-microsoft/canvases-cloud-foundation/tree/paulyuk-microsoft-fix-hosted-skill-authoring/canvases/azure-functions-hosted-skills`.
2. In GitHub Copilot, choose **Install extension from URL…** and paste the
   staging URL.
3. Open **Azure Functions Hosted Skills Preview** in a project chat.

See [Key features](FEATURES.md) for the Local and Azure workflows.

## Prerequisites

- Azure CLI, signed in with `az login`
- GitHub CLI, signed in with `gh auth login`
- Python 3.10 or later
- Azure Functions Core Tools v4

The extension includes pinned Azurite availability for local Timer and Queue
storage. It uses the host process environment and the shared portable command
resolver rather than assuming repository-level dependencies or shell PATH
behavior.

The canvas opens as `azure-functions-hosted-skills`. On first open it creates a unique owned
workspace, discovers an accessible Microsoft Foundry project and model, writes
credential-free source plus process-local runtime settings, and starts the local
Functions host. It preserves the generated workspace across provider restarts
and restarts the local host after rehydration.

## Authoring

- **Timer**, **HTTP**, and **Queue** have implemented local flows.
- **Connector**, **Blob**, and **Cosmos DB** remain visible but disabled.
- Hosted Skills declare request parameters with the runtime's `input_schema`
  frontmatter field. The generic **Parameters JSON object** editor applies
  declared defaults, safely persists non-credential drafts, and sends the same
  body to HTTP invocation and Timer's HTTP test twin. Canvas-authored templates
  encode the schema as an inline JSON object, which is valid YAML and avoids
  ambiguous prompt parsing.
- The daily digest declares a required `repository` parameter defaulting to
  `Azure/azure-functions-host`. It accepts `owner/repo` or a normal GitHub
  repository URL, validates token access without requiring ownership or
  `/user/repos` membership, and enables GitHub credential/MCP evidence gates
  only for that declared requirement.
- GitHub daily digests apply an exact 24-hour UTC window and compact tool
  results before they reach the model.
- **Commands** records bounded, redacted activity for Azure discovery, local
  dependency preparation, storage, Functions startup and probes, invocation,
  trigger operations, and deployment.

## Deploy to Azure

Use **Deploy to Azure** only after reviewing the selected subscription,
location, and model. Deployment runs an isolated `azd` snapshot with managed
identity, Microsoft Foundry RBAC, explicit package-index policy, phase output,
cancellation, and fail-closed Bicep validation. Local credentials and generated
runtime state are excluded from the deployment snapshot.
