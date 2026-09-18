---
name: Hosted Skill HTTP
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

Describe the task this hosted skill should perform.
