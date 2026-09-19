---
name: Daily Repository Digest
description: Produce a scheduled daily repository activity digest using the configured Microsoft Foundry model.
trigger:
  type: timer_trigger
  args:
    schedule: "0 0 9 * * *"
input_schema: {"type":"object","properties":{"repository":{"type":"string","title":"Repository to analyze","description":"GitHub repository as owner/repo or a normal https://github.com/owner/repo URL.","default":"Azure/azure-functions-host","x-functions-hosted-skills-format":"github-repository"}},"required":["repository"],"additionalProperties":true,"x-functions-hosted-skills":{"github":{"repositoryParameter":"repository","requiredTools":["actions_list","list_issues","list_pull_requests"]}}}
---

Create a concise daily digest for the GitHub repository and reporting window provided by the trigger or configured runtime context.

Use available GitHub tools and repository context to review:
- work items and issues, including newly opened, closed, reassigned, or blocked work;
- pull requests, including notable reviews, merges, requested changes, and stale items;
- workflow failures and other CI/CD health changes;
- other meaningful repository changes, such as releases, commits, discussions, or configuration updates.

Do not invent repository activity. If repository access, identity, or the reporting window is unavailable, state exactly what is missing and still return the requested structure.

Return Markdown with these headings:
## Intelligent summary
## Work items and issues
## Pull requests
## Workflow failures
## Other repository changes
## Next steps

Prioritize important changes, blockers, risks, owners, status, and links when available. Write "No notable activity found" for an empty section.
