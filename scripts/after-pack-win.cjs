const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const run = promisify(execFile);

function toWindowsVersion(version) {
  const parts = String(version)
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part))
    .slice(0, 4);

  while (parts.length < 4) {
    parts.push(0);
  }

  return parts.join(".");
}

module.exports = async function afterPackWin(context) {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const root = context.packager.projectDir;
  const appInfo = context.packager.appInfo;
  const exePath = path.join(context.appOutDir, `${appInfo.productFilename}.exe`);
  const iconPath = path.join(root, "public", "app-icon.ico");
  const preparedRcedit = path.join(root, ".electron-builder-rcedit", "rcedit-x64.exe");
  const vendorRcedit = path.join(root, "node_modules", "electron-winstaller", "vendor", "rcedit.exe");
  const rceditPath = fs.existsSync(preparedRcedit) ? preparedRcedit : vendorRcedit;

  if (!fs.existsSync(exePath)) {
    throw new Error(`Packed exe not found: ${exePath}`);
  }
  if (!fs.existsSync(iconPath)) {
    throw new Error(`App icon not found: ${iconPath}`);
  }
  if (!fs.existsSync(rceditPath)) {
    throw new Error(`Local rcedit not found: ${rceditPath}`);
  }

  const version = toWindowsVersion(appInfo.version);
  const productName = appInfo.productName;

  await run(rceditPath, [
    exePath,
    "--set-version-string",
    "FileDescription",
    productName,
    "--set-version-string",
    "ProductName",
    productName,
    "--set-version-string",
    "LegalCopyright",
    appInfo.copyright,
    "--set-version-string",
    "InternalName",
    path.basename(exePath, ".exe"),
    "--set-version-string",
    "OriginalFilename",
    path.basename(exePath),
    "--set-file-version",
    version,
    "--set-product-version",
    version,
    "--set-icon",
    iconPath,
  ]);
};
