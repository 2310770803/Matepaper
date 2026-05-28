$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$electronDist = Join-Path $root "node_modules\electron\dist"
$releaseRoot = Join-Path $root "release"
$outDir = Join-Path $releaseRoot "Matepaper-win-unpacked"
$appDir = Join-Path $outDir "resources\app"
$package = Get-Content -Raw -Encoding UTF8 (Join-Path $root "package.json") | ConvertFrom-Json
$zipPath = Join-Path $releaseRoot ("Matepaper-win-unpacked-{0}-x64.zip" -f $package.version)

if (!(Test-Path $electronDist)) {
  throw "Electron runtime not found. Run npm install first."
}

$resolvedRelease = [System.IO.Path]::GetFullPath($releaseRoot)
$resolvedOut = [System.IO.Path]::GetFullPath($outDir)
if (!$resolvedOut.StartsWith($resolvedRelease, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Output path is outside release directory."
}

New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null
if (Test-Path $outDir) {
  Remove-Item -LiteralPath $outDir -Recurse -Force
}
if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Copy-Item -LiteralPath $electronDist -Destination $outDir -Recurse

$electronExe = Join-Path $outDir "electron.exe"
$matepaperExe = Join-Path $outDir "Matepaper.exe"
if (Test-Path $matepaperExe) {
  Remove-Item -LiteralPath $matepaperExe -Force
}
Move-Item -LiteralPath $electronExe -Destination $matepaperExe

New-Item -ItemType Directory -Force -Path $appDir | Out-Null
Copy-Item -LiteralPath (Join-Path $root "dist") -Destination (Join-Path $appDir "dist") -Recurse
Copy-Item -LiteralPath (Join-Path $root "electron") -Destination (Join-Path $appDir "electron") -Recurse
Copy-Item -LiteralPath (Join-Path $root "public") -Destination (Join-Path $appDir "public") -Recurse
Copy-Item -LiteralPath (Join-Path $root "package.json") -Destination (Join-Path $appDir "package.json")

Compress-Archive -Path $outDir -DestinationPath $zipPath -Force

Write-Output "Generated $matepaperExe"
Write-Output "Generated $zipPath"
