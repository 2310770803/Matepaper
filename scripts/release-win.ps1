$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $root ".electron-builder-temp"
$builder = Join-Path $root "node_modules\.bin\electron-builder.cmd"

if (!(Test-Path $builder)) {
  throw "electron-builder not found. Run npm install first."
}

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:TEMP = $tempDir
$env:TMP = $tempDir
$env:ELECTRON_BUILDER_RCEDIT_PATH = Join-Path $root ".electron-builder-rcedit"

& (Join-Path $PSScriptRoot "prepare-rcedit.ps1")
& npm run build
& $builder --win nsis portable
& (Join-Path $PSScriptRoot "package-win-dir.ps1")
