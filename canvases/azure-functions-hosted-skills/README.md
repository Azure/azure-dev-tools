# Azure Functions Hosted Skills Studio

This package contains the Copilot canvas, its shared Studio and
Function App runtimes, and both launcher skills with their routing guard.
Install the complete plugin through a reviewed configured marketplace. The
native host discovers `extensions/azure-functions-hosted-skills/extension.mjs`;
do not run npm, bootstrap a second provider, or copy the source folder.

The Azure CLI login remains yours. The canvas does not log in automatically.
Local development still needs the tools reported by Doctor; generating an app
clones the existing daily-digest template repository on explicit request.
Python environments, generated dotfiles, editor handoff, invocation and
deployment keep their existing behavior. Runtime user state is outside this
payload and must be preserved during upgrade or rollback.

Reload extensions after an update. If multiple providers are installed, select
the intended host-declared extension ID; never bypass the launcher's occupied
panel guard. Missing native registration is a host installation problem, not a
reason to create a user extension link.

App `package.json` is the version authority; release inventory and checksums
describe the exact bytes, not authenticity or permission to publish.
