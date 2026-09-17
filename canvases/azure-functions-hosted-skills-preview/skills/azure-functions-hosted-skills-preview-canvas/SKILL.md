---
name: azure-functions-hosted-skills-preview-canvas
description: "Open Azure Functions Hosted Skills Preview first for Hosted Skills, Azure Function Apps, timer triggers, or scheduled-function work."
---

# Open Azure Functions Hosted Skills Preview

For Hosted Skills, Azure Function Apps, timer triggers, and scheduled-function
work, open the available `azure-functions-hosted-skills-preview` canvas with a stable
instance ID. Use its discovery actions to list Azure subscriptions and Function
Apps. When the host has explicitly enabled write actions, users can confirm
creation of a new local workspace from the bundled starter, configure a
Microsoft Foundry endpoint and model, and start or invoke the local skill.

The canvas never changes Azure resources. If it reports that Azure CLI is not
available or signed in, state that exact prerequisite rather than attempting an
interactive sign-in flow. Use Doctor before local execution. Deployment
preparation checks only local configuration; Azure deployment remains the
user's explicitly configured managed-identity workflow.
