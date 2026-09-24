# Azure plugin marketplace staging

## Full-plugin install (primary)

Once the marketplace is approved and published, in GitHub Copilot App open
**Customize → Plugins**, use the gear beside the marketplace dropdown to add
the GitHub repository `Azure/azure-dev-tools`, then select the
`azure-dev-tools` marketplace. Install `azure-sre-agent`,
`azure-functions-hosted-skills`, `azure-resources-query`, and/or
`canvas-authoring` separately. Restart Copilot; for the first three, ask it
to **Open Azure SRE Agent**, **Open Azure Functions Hosted Skills**, or **Open
Azure Resources Query** by name, then check the companion skills. Resources
Query needs a query and confirmed scope before showing results. For
`canvas-authoring`, check its single `create-canvas-app` skill instead: it
contributes no canvas or extension.

[GitHub's App guide](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app#adding-plugins)
documents the registration workflow, but **this marketplace's App install has
not yet been verified**.

The equivalent full-plugin CLI commands, after marketplace publication, are:

```shell
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin marketplace browse azure-dev-tools
copilot plugin install azure-sre-agent@azure-dev-tools
copilot plugin install azure-functions-hosted-skills@azure-dev-tools
copilot plugin install azure-resources-query@azure-dev-tools
copilot plugin install canvas-authoring@azure-dev-tools
copilot plugin list
copilot skill list
```

## Staging channel and release gate

The three canvas products (SRE Agent 0.2.4, Functions Hosted Skills 0.5.1,
and Resources Query 0.1.1) share reviewed public release commit `482188d`.
The fourth product, `canvas-authoring` 0.1.0, merged separately at public
product commit `5bea7ba`; its final updated head still needs human release
attestation. Its
immutable `canvas-authoring-v0-1-0-23aa6b1` tag and
`canvas-authoring-latest` must both point to that product commit. **Neither
builder tag currently exists; the merged marketplace is not a release or
install-ready.** Its merged
public `SHA256SUMS` digest is
`ae94421b2b6db7f5252b9f5b2099d2a3ff185ff2c82a8d0ebfe9f35695a0e2da`.
The [merged public package](https://github.com/Azure/azure-dev-tools/tree/5bea7baefed06b627a279da2dcc78331289598ef/plugins/canvas-authoring)
is not an approved marketplace install target. The candidate fixture is static
test data, not an installation catalog.

Entries use same-repository `canvases/<product>` paths for canvas packages and
`plugins/canvas-authoring` for the skill-only builder. This is a **mutable
staging/latest channel**, not an immutable pin: later marketplace checkouts
follow the then-current public default branch, and `version` is display
metadata. After fetching the public immutable release tags, run
`node --test test/plugin-marketplace.test.mjs` and
`node scripts/verify-plugin-marketplace.mjs` before merge. The validator
requires a unique version tag per product and current package trees to match
tagged bytes, checks each tag's source fragment against its independently reviewed
full source SHA, and checks manifest shape and skill count. The first three
tags must point to the exact reviewed release commit. The builder tag must
point to the exact `5bea7ba` product commit merged into public `origin/main`,
introduce only files under `plugins/canvas-authoring/` relative to staging
main, have the merged
`SHA256SUMS` receipt, per-file digests and inventory, and match
`canvas-authoring-latest`. Fetch current `origin/main` and release tags before
verification. The marketplace
branch must include that commit. Synthetic local-only tags in temporary clones
exercise the pretag verifier; they are not releases and must never be pushed.
Build-input provenance remains a separate release PR review fact; tag names
alone do not prove build origin. The default verifier **fails closed** while
the real builder tag is absent; there is no `--candidate` bypass.

After approved merge and authorization to install, check the actual
GitHub-hosted marketplace with fresh, isolated
`HOME`, `COPILOT_HOME`, and `COPILOT_CACHE_HOME` directories. Confirm that each
canvas plugin contains its `extensions/<product>` directory and all declared
skills, and that the builder contributes one skill but no extension. Compare
installed package bytes to the reviewed immutable tag; an `install` success
message alone is insufficient. In CLI 1.0.84-5, a
local-directory marketplace with a remote SHA-pinned plugin source can report
success while leaving no plugin or skill installed. Do not use a personal
profile for smoke tests or mistake that local test for remote App verification.

## Fallbacks

For a reproducible CLI install after a product's approved release, check out
its immutable tag and install `./canvases/<product>` or
`./plugins/canvas-authoring` with `copilot plugin install`. Direct CLI
installs currently warn that this form may be deprecated in a future release.
The separate App **Customize → Canvases → Install from gist/URL** path is a
canvas-only fallback: it installs an extension, not its plugin skills. It is
not an install path for the skill-only builder. The host's native
`create-canvas` skill is required for builder workflows. Canonical npm
publishes `@microsoft/canvas-toolkit@0.1.0-preview.2` with a `/build` runtime
and types export. The product owner reports isolated Azure and counter
generated-app build/tests passing against the public registry; native-host
activation and marketplace/App plugin installation remain unverified. Do not
claim an end-to-end customer-ready GUI/build.
