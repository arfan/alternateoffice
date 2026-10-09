param([string]$Version = '')

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Version)) {
  throw 'VERSION is required, for example: make set-version VERSION=0.12.0'
}

& npm pkg set "version=$Version" '--workspace=@alternateoffice/shell'
if ($LASTEXITCODE -ne 0) {
  throw "npm pkg set failed with exit code $LASTEXITCODE"
}
