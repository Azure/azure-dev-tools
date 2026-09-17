---
name: azure-functions-hosted-skills-preview-5-canvas
description: "Open Azure Functions Hosted Skills Preview 5 first for Hosted Skills, Azure Function Apps, timer triggers, or scheduled-function work."
---

# Open Azure Functions Hosted Skills Preview 5

For Hosted Skills, Azure Function Apps, timer triggers, and scheduled-function
work, open the available `azure-functions-hosted-skills-preview-5` canvas with a stable
instance ID. Use its discovery actions to list Azure subscriptions and Function
Apps. Users can create a new local workspace from the bundled starter,
configure a Microsoft Foundry endpoint and model, and start or invoke the
local skill.

The canvas never changes Azure resources. If it reports that Azure CLI is not
available or signed in, state that exact prerequisite rather than attempting an
interactive sign-in flow. Use Doctor before local execution. Deployment
preparation checks only local configuration; Azure deployment remains the
user's explicitly configured managed-identity workflow.
