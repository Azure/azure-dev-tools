---
name: Hosted Skill HTTP
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
