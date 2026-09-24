# Azure canvas plugin marketplace

The marketplace offers three independently installable canvas plugins. The
manifest **must not be merged** until the advertised package versions
(SRE Agent 0.2.4, Functions Hosted Skills 0.5.1, and Resources Query 0.1.1)
have been reviewed, merged, and tagged independently. The test fixture in
`test/fixtures/marketplace.candidate.json` uses earlier public commits solely
to validate the manifest structure; it is not an installation catalog.

Each catalog entry uses its same-repository `canvases/<product>` directory.
This is a **mutable staging/latest channel**, not an immutable plugin pin:
future marketplace checkouts follow the then-current public default branch.
The `version` field is display metadata, not a source pin. The release tag
is the immutable fallback for reproducible CLI installation. Before merging
this manifest, fetch the public release tags and run
`node --test test/plugin-marketplace.test.mjs` and
`node scripts/verify-plugin-marketplace.mjs`. The validator requires one
immutable version tag per product, checks that the current package tree exactly
matches that tag, and verifies the package's `plugin.json`, extension, and
declared skill files. It intentionally fails while target releases are absent.
For an immutable direct-install fallback, check out the exact product tag
linked from its release README and install the local
`./canvases/<product>` plugin directory with `copilot plugin install`. Direct
CLI installs currently warn that this form may be deprecated in a future
release.

After the marketplace PR is reviewed and merged, validate its actual GitHub
source in a fresh, isolated `HOME`, `COPILOT_HOME`, and `COPILOT_CACHE_HOME`
before recommending it to users:

```shell
copilot plugin marketplace add Azure/azure-dev-tools
copilot plugin marketplace browse azure-dev-tools
copilot plugin install azure-sre-agent@azure-dev-tools
copilot plugin install azure-functions-hosted-skills@azure-dev-tools
copilot plugin install azure-resources-query@azure-dev-tools
copilot plugin list
copilot skill list
```

Confirm that each installed plugin contains its `extensions/<product>` directory
and all declared skills, and compare installed package bytes to the reviewed
immutable tag, not merely that `install` exits successfully. In CLI
1.0.84-5, a **local-directory marketplace with a remote SHA-pinned plugin
source** can report success while leaving no installed plugin or skill; that
test does not establish whether a published GitHub-hosted marketplace works.
Do not install into a user's existing profile to test the marketplace.

GitHub's [App guide](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app#adding-plugins)
documents **Customize → Plugins → marketplace gear → add repository or Git URL**
and then **Install** for each named plugin. Restart Copilot and check that
the canvas opens and its skills appear. This marketplace and its extensions
have not yet been verified through the App UI. The separate **Customize →
Canvases → Install from gist/URL** path installs an extension, not a full plugin
with skills.
