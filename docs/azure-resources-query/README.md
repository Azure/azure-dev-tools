# Install Azure Resources Query

Azure Resources Query is a **candidate** canvas distribution for read-only
Azure Resource Graph queries. Candidate staging does not constitute a production
release or completion of security, legal, licensing, or public-release reviews.

The [package](../../canvases/azure-resources-query/) contains the esbuild-built
extension, browser assets, launcher skill, consumer guide, and third-party
notices. It does not require access to the source repository, `npm install`,
or a local build. The Copilot host supplies `@github/copilot-sdk/extension`;
the other JavaScript dependencies are bundled.

## Prerequisites

- A GitHub Copilot environment that supports canvas extensions and provides
  Node.js 22 or later.
- [Azure CLI 2.61 or later](https://learn.microsoft.com/cli/azure/install-azure-cli),
  available on the extension provider's PATH.
- An Azure CLI account signed in with `az login` and read access to the
  subscriptions and resources you want to query. The canvas does not grant
  permissions or sign in automatically.

## Install the canvas extension

After this candidate is merged into `main`, open **Customize > Canvases >
Install from gist/URL** in GitHub Copilot and paste:

```text
https://github.com/Azure/azure-dev-tools/tree/main/canvases/azure-resources-query/extensions/azure-resources-query
```

For a candidate under review, use the commit-pinned URL in its pull request
instead. For a reproducible installation, replace `main` in the URL with the
reviewed commit SHA.

Install the complete nested extension directory, then fully quit and reopen
GitHub Copilot. Ask:

```text
Open the Azure Resources Query canvas.
```

The URL must end in `extensions/azure-resources-query`, where `extension.mjs`
lives. Do not install the package wrapper as a direct extension.

**Direct URL installation installs only the canvas extension.** It does not
install the package's launcher skill. The complete plugin package separately
declares its extension and skill in
[`.github/plugin/plugin.json`](../../canvases/azure-resources-query/.github/plugin/plugin.json).
Use a host-supported plugin installation flow for the complete package when
approved candidate instructions are available; no marketplace registration is
claimed here.

Before using or redistributing the extension, review the full package's
[third-party notices](../../canvases/azure-resources-query/THIRD_PARTY_NOTICES.txt).
These notices live at the package root, outside the direct-install directory;
retain them with any redistributed copy.

## Use and update

See the [consumer guide](../../canvases/azure-resources-query/README.md) for
scope confirmation, resource inspection, selection, **Add to chat**, and
troubleshooting. Adding selected resources to chat supplies context, not
authorization to modify them. The illustrated resource data is synthetic.

To update or roll back a direct installation, close its canvas and replace the
whole extension directory with the chosen reviewed version, not individual
files. Preserve saved views and the session's
`files/azure-resource-browser` state. Do not install duplicate providers to
work around a stale registration.

## Integrity and release status

This candidate packages version `0.1.0` from source revision
`ca0fb96e0c0637d325b483fb8e9f1ff1df4310a3`, built with Node.js `24.15.0`
and esbuild `0.25.12`. The host runtime minimum remains Node.js 22.

The canonical package is preserved byte-for-byte.
[`release.json`](../../canvases/azure-resources-query/release.json) records its
version, runtime requirements, esbuild version, build-input digests, modules,
and assets.
[`checksums.json`](../../canvases/azure-resources-query/checksums.json) covers
every other canonical package file.

The repository's additional [SHA256SUMS](SHA256SUMS) inventory is kept beside
this guide so it does not alter the canonical package or its inventories.
From the repository root, verify all distributed files with:

```sh
shasum -a 256 -c docs/azure-resources-query/SHA256SUMS
```

Checksums detect changes; they are not signatures, publisher authentication,
installer verification, or permission to publish. Public-release approval,
first-party component and icon rights, and supported desktop-host evidence
remain release-owner gates under the [release process](../release-process.md).
