# Canvas release process

Canvas packages in this repository are published only after the candidate has
been reviewed and approved. A release must preserve both reproducible package
bytes and a stable customer installation path.

## Release tags

Each product uses two tag forms:

- `PRODUCT-latest` is movable. Update it only after the approved candidate PR
  merges. It must point to the same merge commit as the new immutable tag.
- `PRODUCT-v<semver>-<source-sha>` is immutable. The repository's current tag
  convention writes semantic-version separators as hyphens, for example
  `PRODUCT-v1-2-3-abcdef0`. Never move, delete, or recreate an immutable tag.

A package version identifies one exact set of bytes. Once a version has been
used for a public candidate or release, different bytes require a new version,
even when the change is described as a rebuild or correction. The source SHA in
the immutable tag records the reviewed source revision; it does not permit the
same version to be reused for different output.

Release order:

1. Start with content cleared for public distribution in this repository.
2. Run the package's required tests and release checks.
3. Produce an inventory of the package files and record their SHA-256 digests
   in `SHA256SUMS`.
4. Obtain explicit approval for the candidate and its customer-facing
   materials.
5. Merge the approved candidate PR.
6. Create the immutable `PRODUCT-v<semver>-<source-sha>` tag at the merge
   commit.
7. Verify the immutable install URL and README, then move `PRODUCT-latest` to
   that same merge commit.
8. Verify the latest install URL and README before sending the announcement.
9. Pin the released package in the Awesome Copilot catalog, when applicable.

Never move `PRODUCT-latest` to an unmerged branch, candidate commit, or
unapproved rebuild.

## Customer README verification

Release verification must fail closed if a package export replaces a
customer-facing README with internal packaging, build, or provider prose.
Before approval and again after tagging, verify that the README:

- starts with the customer value statement;
- includes an `## Install` section with the
  `PRODUCT-latest/canvases/PRODUCT/extensions/EXTENSION` nested-folder URL;
- links to the README through `PRODUCT-latest`;
- includes the exact prompt needed to open the canvas;
- includes a numbered quickstart using actual UI labels; and
- retains applicable prerequisites, troubleshooting, and safety guidance.

An export may update the README only when the release PR explicitly presents
the customer-facing change for review. Missing sections, a wrapper-directory
install URL, a branch URL, or packaging-only prose blocks the release.

## Copy/paste team announcement

Every release PR must include a ready-to-send announcement with exactly two
bullets. Replace every placeholder; do not hard-code this template to a future
version.

- **`<Product> <version>`:** `<short customer value and rollout statement>`.
  **Rollout owner:** `<person or team>`. **Dark-deployed:** `<status and scope,
  when applicable>`.
- **Install:** latest
  `<https://github.com/Azure/azure-dev-tools/tree/<product>-latest/canvases/<product>/extensions/<extension>>`;
  README
  `<https://github.com/Azure/azure-dev-tools/blob/<product>-latest/canvases/<product>/README.md>`;
  exact version
  `<https://github.com/Azure/azure-dev-tools/tree/<product>-v<major>-<minor>-<patch>-<source-sha>/canvases/<product>/extensions/<extension>>`.

The first bullet must name the product and version, explain the value or rollout
in one short statement, and use the literal wording **Rollout owner:**. Include
the **Dark-deployed:** field when the release is available before broad
announcement or enablement. The second bullet must contain paste-ready latest,
README, and immutable source-qualified URLs.

## Governance

`SHA256SUMS` records file integrity digests. It is not a signature, does not
imply a signing mechanism, and does not claim installer verification.

Each release must also complete applicable security, legal, licensing,
third-party-notice, and open-source readiness reviews. Add third-party notices
only when released payloads require them; this governance-only repository has
none to publish.
