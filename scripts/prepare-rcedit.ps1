$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$vendorRcedit = Join-Path $root "node_modules\electron-winstaller\vendor\rcedit.exe"
$outDir = Join-Path $root ".electron-builder-rcedit"

if (!(Test-Path $vendorRcedit)) {
  throw "Local rcedit.exe not found. Run npm install first."
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Copy-Item -LiteralPath $vendorRcedit -Destination (Join-Path $outDir "rcedit-x86.exe") -Force
Copy-Item -LiteralPath $vendorRcedit -Destination (Join-Path $outDir "rcedit-x64.exe") -Force

Write-Output "Prepared local rcedit bundle at $outDir"
