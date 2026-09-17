# Azure Developer Tools

This repository is a future public home for Azure developer-experience tools,
such as GitHub Copilot canvases and skills. Content originates from approved
internal builds and is added here only after the applicable review and release
approval.

The repository is currently private and contains governance documentation only.
It does not currently publish installable canvases, release artifacts, catalog
entries, or signing and installer-verification mechanisms. Open-source
readiness and public release remain pending review and approval.

## Intended layout

Future independently installable canvas packages will live under
`canvases/<canvas-id>/`. A catalog manifest, when needed, will be created and
released only after its format and publication process are approved.

```text
canvases/
  <canvas-id>/
docs/
  release-process.md
```

## Contributing and support

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations,
[SECURITY.md](SECURITY.md) for vulnerability reporting, and
[SUPPORT.md](SUPPORT.md) for the current support status.
