# Install Azure canvas plugins

## Full-plugin install (primary)

Once the marketplace is approved and published, in GitHub Copilot App open
**Customize → Plugins**, use the gear beside the marketplace dropdown to add
the GitHub repository `Azure/azure-dev-tools`, then select the
`azure-dev-tools` marketplace. Install `azure-sre-agent`,
`azure-functions-hosted-skills`, and/or `azure-resources-query` separately.
Restart Copilot, open the canvas, and verify its companion skills appear.
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
copilot plugin list
copilot skill list
```

## Staging channel and release gate

The manifest **must not be merged** until SRE Agent 0.2.4, Functions Hosted
Skills 0.5.1, and Resources Query 0.1.1 are reviewed, merged, and tagged
independently. The test fixture in `test/fixtures/marketplace.candidate.json`
uses earlier public commits only to validate manifest structure; it is not an
installation catalog.

Entries use same-repository `canvases/<product>` paths. This is a **mutable
staging/latest channel**, not an immutable pin: later marketplace checkouts
follow the then-current public default branch, and `version` is display
metadata. After fetching the public immutable release tags, run
`node --test test/plugin-marketplace.test.mjs` and
`node scripts/verify-plugin-marketplace.mjs` before merge. The validator
requires a unique version tag per product, checks that the current package
tree exactly matches it, and verifies `plugin.json`, the extension, and all
expected skills (including both Hosted Skills companions). It intentionally
fails while target releases are absent.

After merge, check the actual GitHub-hosted marketplace with fresh, isolated
`HOME`, `COPILOT_HOME`, and `COPILOT_CACHE_HOME` directories. Confirm that each
installed plugin contains its `extensions/<product>` directory and all
declared skills, and compare installed package bytes to the reviewed immutable
tag; an `install` success message alone is insufficient. In CLI 1.0.84-5, a
local-directory marketplace with a remote SHA-pinned plugin source can report
success while leaving no plugin or skill installed. Do not use a personal
profile for smoke tests or mistake that local test for remote App verification.

## Fallbacks

For a reproducible full-plugin CLI install, check out the exact product's
immutable tag linked from its release README and install its local
`./canvases/<product>` directory with `copilot plugin install`. Direct CLI
installs currently warn that this form may be deprecated in a future release.
The separate App **Customize → Canvases → Install from gist/URL** path is a
canvas-only fallback: it installs an extension, not its plugin skills.
