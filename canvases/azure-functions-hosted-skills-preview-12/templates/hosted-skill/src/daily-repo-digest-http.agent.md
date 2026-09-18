---
name: Daily Repository Digest HTTP
description: Answer an HTTP request with a repository activity digest using the configured Microsoft Foundry model.
trigger:
  type: http_trigger
  args:
    route: hosted-skill
    methods: ["POST"]
    auth_level: function
mcp: true
timeout: 1800
---

Create a concise daily digest for the GitHub repository and reporting window provided by the HTTP request or configured runtime context.

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
