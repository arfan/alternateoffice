# Rebranding plan

This migration deliberately does not rename internal `@genoffice/*` package
names. Keeping those names stable reduces merge risk while the Office engines
are decoupled from AI.

## Inventory

- Visible product and repository branding: `GenOffice` / `genspark-ai/genoffice`.
- Package scope and workspace names: `@genoffice/*`.
- Repository and release URLs: GitHub `genspark-ai/genoffice` and
  `genoffice.ai` references in documentation and product copy.
- Electron titles, bundle identifiers, executable names, icons, and updater
  identifiers are under `apps/shell`, `packaging`, and the app manifests.
- README translations and screenshots contain extensive AI-era product copy.

## Later rename sequence

1. Choose the replacement product name, reverse-DNS application id, executable
   name, and update channel identifiers.
2. Change visible UI strings, docs, websites, icons, and release metadata.
3. Change package scope/imports in one mechanical, reviewed migration.
4. Update Electron bundle ids, installer metadata, updater endpoints, and CI.
5. Regenerate notices and run all packaging/build checks.

The current work should only remove AI branding from active UI/configuration;
it should not perform this global rename.
