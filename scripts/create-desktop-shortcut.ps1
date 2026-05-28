$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root "release\Matepaper-win-unpacked\Matepaper.exe"
$icon = Join-Path $root "public\app-icon.ico"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Matepaper.lnk"

if (-not (Test-Path -LiteralPath $target)) {
  throw "Missing $target. Run npm run release:win first."
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = Split-Path -Parent $target
$shortcut.WindowStyle = 1
if (Test-Path -LiteralPath $icon) {
  $shortcut.IconLocation = "{0},0" -f $icon
}
$shortcut.Save()

Write-Host "Created desktop shortcut: $shortcutPath"
Write-Host "Target: $target"
