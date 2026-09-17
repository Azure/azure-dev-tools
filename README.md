# Azure Developer Tools

This repository is a future public home for Azure developer-experience tools.
Its first intended GitHub Copilot canvas package areas are Functions Hosted
Skills and Azure SRE Agent. Content originates from approved internal builds
and is added here only after the applicable review and release approval.

The repository is currently private and contains governance documentation only.
It does not currently publish installable canvases, release artifacts, catalog
entries, or signing and installer-verification mechanisms. Open-source
readiness and public release remain pending review and approval.

## Intended layout

Future independently installable canvas packages will live under
`canvases/<canvas-id>/`. The current Functions Hosted Skills and Azure SRE Agent
Studio directories contain no package payload. A catalog manifest, when
needed, will be created and released only after its format and publication
process are approved.

```text
canvases/
  azure-functions-hosted-skills/
  azure-sre-agent/
docs/
  release-process.md
```

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations,
[SECURITY.md](SECURITY.md) for vulnerability reporting, and
[SUPPORT.md](SUPPORT.md) for the current support status.
