# AlternateOffice rebranding

The product is now AlternateOffice. Workspace names/imports use
`@alternateoffice/*`; the CLI and installer executable use `alternateoffice`.
Source filenames, packaging manifests, build scripts, tests and documentation
have been updated together. The repository checkout directory is unchanged.

## Deliberately retained references

- Upstream URLs, license notices, copyright and author attribution still identify
  the original GenOffice project. No replacement hosting or release endpoint was supplied.
- Electron profiles remain in `GenOffice` / `GenOffice Dev`, and hidden `.genoffice`
  storage paths remain compatible. `ALTERNATEOFFICE_USER_DATA` overrides the profile;
  the previous `GENOFFICE_USER_DATA` override is also accepted by the shell and CLI.
- Bundled font names and filenames remain unchanged for document compatibility.
- Existing binary screenshots and artwork have not been redrawn.
- Docker, Flatpak and Nix recipes still wrap upstream release binaries. Their
  upstream runtime paths remain intact; these wrappers do not yet distribute
  this fork. Use the source build / Electron packaging for AlternateOffice.

Build-time configuration uses the `ALTERNATEOFFICE_` environment prefix.
Deployments must configure their own release endpoints and secrets under that prefix.
Upstream repository links describe provenance, not an AlternateOffice release service.
