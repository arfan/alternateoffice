param(
  [string]$Version = '',
  [string]$SidecarTarget = 'x86_64-pc-windows-msvc'
)

$ErrorActionPreference = 'Stop'
$env:ALTERNATEOFFICE_WIN_SIDECAR_TARGET = $SidecarTarget

function Invoke-Npm {
  param([string[]]$Arguments)
  & npm @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "npm $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

Invoke-Npm @('run', 'notices')
Invoke-Npm @('run', 'build:all')

$builderArguments = @('run', 'dist:win', '-w', '@alternateoffice/shell')
if ($Version.Trim().Length -gt 0) {
  $builderArguments += '--'
  $builderArguments += "-c.extraMetadata.version=$Version"
}
Invoke-Npm $builderArguments
