# Future release process

This repository has no release artifacts or installable packages today. The
following contract applies when a canvas package is proposed for public
distribution:

1. Start from an approved internal source build that is cleared for this
   repository.
2. Run the package's required tests and release checks.
3. Produce an inventory of the package files and record their SHA-256 digests
   in `SHA256SUMS`.
4. Obtain explicit approval to publish the package and its accompanying
   materials.
5. Commit the approved public distribution content to this repository.
6. Pin the released package in the Awesome Copilot catalog, when applicable.

`SHA256SUMS` records file integrity digests. It is not a signature, does not
imply a signing mechanism, and does not claim installer verification.

Each release must also complete applicable security, legal, licensing,
third-party-notice, and open-source readiness reviews. Add third-party notices
only when released payloads require them; this governance-only repository has
none to publish.
