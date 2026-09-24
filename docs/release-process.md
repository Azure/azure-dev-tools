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

A package version identifies one exact set of protected payload bytes. Once a
version has been used for a public candidate or release, different runtime,
skills, manifests, legal notices or other protected bytes require a new version,
even when the change is described as a rebuild or correction. Regular
non-executable `README*` text files at non-runtime package depths and text or
raster images under package-root `doc/` or `docs/` are mutable on the
marketplace branch without a version change or tag reset. Allowed text is
bare `README` or `.md`, `.markdown`, `.txt`, `.rst`, `.adoc`; allowed images
are `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.avif`. Executable/active
content (`.js`, `.mjs`, `.html`, `.svg`), symlinks, submodules, nested docs and
files referenced directly by runtime code or declared runtime assets remain
protected. Review dynamic runtime file access separately; do not infer that
every file under a documentation path is safe to exempt. License, licence,
notice, copying, copyright, authors, attribution and patents files,
`SHA256SUMS`, and `inventory.json` are never exempt, even under documentation
paths. The source SHA in the immutable tag records
the reviewed source revision; it does not
permit the same version to be reused for different protected output. Git commit
and tree IDs still cover all files, including documentation; SHA-256 receipts
are integrity records, not signatures. Existing full receipts and
`checksums.json` describe the immutable tagged snapshot, not later
documentation-only edits on `main`.

When one approved public PR contains multiple independently reviewed products,
their distinct source-qualified immutable version tags may all point to that
same PR's merge commit. Verify each product's source revision, version, and
package bytes separately; do not create the tags before the PR merges.
When a later PR releases a separate skill-only plugin, its immutable and latest
tags must point to that later product merge commit, not the earlier combined
canvas release. Marketplace validation must compare the skill-only package
against its own tag and receipt and keep the three existing tags pinned to
their original reviewed commit.

Release order:

1. Start with content cleared for public distribution in this repository.
2. For a new version, separately review the full source SHA, protected
   export receipt/inventory digests, and packaged runtime logo bytes; merge
   their pins-only PR into public `main` before the package candidate PR.
   The candidate cannot approve or change its own pins. Run its required
   tests and the base-pinned candidate check before merge; the default strict
   tag check runs again after tagging. New products require individually
   reviewed catalog identity and skill-path pins first.
3. Produce an inventory of protected package files and record their SHA-256
   digests in `SHA256SUMS`, declaring the receipt scope. Historical full-package
   receipts remain fully enforced at their immutable tags; never rewrite them
   to remove documentation or weaken their original coverage.
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
unapproved rebuild. A main-only documentation edit does not change immutable
or latest tag URLs; link to main when pointing users at updated documentation.

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
the customer-facing change for review. Later documentation-only edits still
need normal review for installation accuracy and safety; the checksum
exception is not approval to remove required customer guidance. Missing
sections, a wrapper-directory install URL, a branch URL, or packaging-only
prose blocks the release.

For a skill-only package under `plugins/`, do not apply the nested canvas URL
and prompt-to-open requirements. Instead require an accurate immutable-tag
plugin directory install path, its host-skill prerequisite, one contributed
skill, and explicit disclosure that no canvas/extension is installed. Do not
conflate a toolkit npm `/build` export with verified generated-app
install/build acceptance.

## Public release PR communication

Write the title for a customer, not a release ledger: start with the specific
problem and name the fix, for example
`Fix <specific customer blocker> with <Product> <version>`, rather than
`Release <Product>`. Put these two parts in the PR body, in this order:

1. **Customer change:** State the concrete problem, how this release fixes it,
   what a user can now do, and what remains unavailable or not yet enabled.
   Lead with the outcome, not build provenance or approval boilerplate.
2. **Release facts and handoff:** Keep a short, labeled list of the source
   revision (full SHA and a commit link if public), the *separate public
   package* commit and artifact link, version, and a link to `SHA256SUMS` with
   the relevant file's SHA-256 digest. Link the nested-folder install URL and
   customer README at the public candidate commit; label them **candidate**,
   not **latest**. After promotion, add the verified immutable-version and
   `PRODUCT-latest` URLs. Record commands/checks actually run and their results;
   mark unrun checks as **not run** with a reason and owner. Name only specific
   remaining risks or blockers, plus the next owner and action.

If the candidate changes, refresh its links, digests, and check results. Do not
claim approvals, latest availability, signing, or installer verification that
have not happened, or list unrelated risks and repeated generic gate language.
This PR-writing guidance does not replace the release order, verification, or
two-bullet announcement requirements.

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
