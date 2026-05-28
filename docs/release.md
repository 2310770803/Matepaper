# Matepaper 发布说明

## 本地生成 Windows 下载包

在 Windows 环境执行：

```bash
npm ci
npm test
npm run release:win
```

生成目录：

```text
release/
```

主要产物：

```text
Matepaper-Setup-<version>-x64.exe
Matepaper-Portable-<version>-x64.exe
Matepaper-win-unpacked-<version>-x64.zip
latest.yml
Matepaper-win-unpacked/Matepaper.exe
```

用途说明：

- `Matepaper-Setup-<version>-x64.exe`：安装版，适合放到 GitHub Release 给普通用户下载。
- `Matepaper-Portable-<version>-x64.exe`：免安装便携版，双击即可运行。
- `Matepaper-win-unpacked-<version>-x64.zip`：完整目录便携包，解压后运行 `Matepaper-win-unpacked/Matepaper.exe`。移动时必须移动整个文件夹，因为 `Matepaper.exe` 依赖同目录下的 `resources/`、DLL 和 Electron 运行时文件。
- `Matepaper-win-unpacked/Matepaper.exe`：未压缩目录版，适合开发者本机快速验证。不要只单独复制其中的 `Matepaper.exe`。

## GitHub Release 发布流程

1. 修改 `package.json` 中的 `version`。
2. 执行完整检查：

```bash
npm test
npm run release:win
```

3. 在 GitHub 创建一个 tag，例如：

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. GitHub Actions 会自动构建 Windows 下载包，并上传到对应 Release。

## 代码签名说明

当前配置默认生成未签名安装包：

```text
CSC_IDENTITY_AUTO_DISCOVERY=false
scripts/electron-builder-noop-sign.cjs
build.win.signAndEditExecutable=false
build.win.signExts=!.exe
scripts/after-pack-win.cjs
scripts/release-win.ps1
build.asar=false
ELECTRON_BUILDER_RCEDIT_PATH=.electron-builder-rcedit
TEMP=.electron-builder-temp
```

`asar=false` 让 Windows 安装包/便携包采用明确的目录资源结构，避免 Electron 38 在写入 ASAR integrity 时触发旧版 `winCodeSign-2.6.0.7z`。`build.win.signAndEditExecutable=false` 关闭 electron-builder 内置的 exe 资源编辑/签名链路，`scripts/after-pack-win.cjs` 改为直接调用本地 `rcedit.exe` 写入图标和版本信息；`build.win.signExts=!.exe` 显式跳过未签名 exe 的签名步骤，避免普通 Windows 权限下解压旧签名工具包的符号链接失败。`scripts/release-win.ps1` 会把 `TEMP/TMP` 指向项目内 `.electron-builder-temp`，避免 NSIS 使用 `C:\Windows\TEMP` 时出现 include 临时文件权限问题。未签名包可以正常下载和双击运行，但 Windows 可能显示安全提示。正式公开发布时，建议申请代码签名证书，再开启签名配置。
