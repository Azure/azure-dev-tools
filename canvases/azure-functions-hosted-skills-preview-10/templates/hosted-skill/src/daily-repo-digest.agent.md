---
name: Hosted Skill
description: Produce a scheduled daily repository activity digest using the configured Microsoft Foundry model.
trigger:
  type: timer_trigger
  args:
    schedule: "0 0 9 * * *"
---

Describe the task this hosted skill should perform.
