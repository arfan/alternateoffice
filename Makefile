# Windows packaging helpers.
#
# Examples:
#   make dist-win
#   make dist-win VERSION=0.12.0
#   make dist-win VERSION=0.12.0 WIN_SIDECAR_TARGET=x86_64-pc-windows-gnu
#
# VERSION is passed to electron-builder as extraMetadata.version. It changes
# the installer version for that build only; it does not edit package.json.
# The persistent application version lives in apps/shell/package.json.

.PHONY: dist-win set-version help

VERSION ?=
WIN_SIDECAR_TARGET ?= x86_64-pc-windows-msvc

help:
	@echo "make dist-win [VERSION=0.12.0]"
	@echo "make set-version VERSION=0.12.0"
	@echo "Override the native target with WIN_SIDECAR_TARGET=..."

dist-win:
	powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/dist-win.ps1 -Version "$(VERSION)" -SidecarTarget "$(WIN_SIDECAR_TARGET)"

set-version:
	powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/set-version.ps1 -Version "$(VERSION)"
