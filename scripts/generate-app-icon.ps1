Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$publicDir = Join-Path $root "public"
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null

function New-RoundedPath {
  param(
    [float] $X,
    [float] $Y,
    [float] $Width,
    [float] $Height,
    [float] $Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-AppIconPngBytes {
  param([int] $Size)

  $scale = $Size / 512
  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $iconPath = New-RoundedPath (36 * $scale) (36 * $scale) (440 * $scale) (440 * $scale) (112 * $scale)
  $bgRect = [System.Drawing.RectangleF]::new(36 * $scale, 36 * $scale, 440 * $scale, 440 * $scale)
  $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $bgRect,
    [System.Drawing.Color]::FromArgb(255, 159, 199, 231),
    [System.Drawing.Color]::FromArgb(255, 98, 200, 141),
    135
  )
  $graphics.FillPath($bgBrush, $iconPath)

  $shinePath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $shinePath.AddBezier(98 * $scale, 116 * $scale, 152 * $scale, 60 * $scale, 240 * $scale, 42 * $scale, 324 * $scale, 66 * $scale)
  $shinePath.AddBezier(324 * $scale, 66 * $scale, 382 * $scale, 82 * $scale, 428 * $scale, 122 * $scale, 450 * $scale, 159 * $scale)
  $shinePath.AddLine(450 * $scale, 132 * $scale, 36 * $scale, 132 * $scale)
  $shinePath.CloseFigure()
  $shineBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(48, 255, 255, 255))
  $graphics.FillPath($shineBrush, $shinePath)

  $paperPath = New-RoundedPath (115 * $scale) (116 * $scale) (261 * $scale) (301 * $scale) (45 * $scale)
  $shadowPath = New-RoundedPath (115 * $scale) (132 * $scale) (261 * $scale) (301 * $scale) (45 * $scale)
  $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(42, 31, 78, 99))
  $graphics.FillPath($shadowBrush, $shadowPath)

  $paperRect = [System.Drawing.RectangleF]::new(115 * $scale, 116 * $scale, 261 * $scale, 301 * $scale)
  $paperBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $paperRect,
    [System.Drawing.Color]::White,
    [System.Drawing.Color]::FromArgb(255, 238, 247, 240),
    90
  )
  $graphics.FillPath($paperBrush, $paperPath)

  $foldPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $foldPath.AddPolygon(@(
    [System.Drawing.PointF]::new(298 * $scale, 116 * $scale),
    [System.Drawing.PointF]::new(376 * $scale, 201 * $scale),
    [System.Drawing.PointF]::new(325 * $scale, 201 * $scale),
    [System.Drawing.PointF]::new(298 * $scale, 174 * $scale)
  ))
  $foldBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 215, 236, 246))
  $graphics.FillPath($foldBrush, $foldPath)

  $lineCap = [System.Drawing.Drawing2D.LineCap]::Round
  $bluePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(200, 79, 143, 189), 22 * $scale)
  $bluePen.StartCap = $lineCap
  $bluePen.EndCap = $lineCap
  $graphics.DrawLine($bluePen, 171 * $scale, 230 * $scale, 341 * $scale, 230 * $scale)

  $greenPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(224, 98, 200, 141), 22 * $scale)
  $greenPen.StartCap = $lineCap
  $greenPen.EndCap = $lineCap
  $graphics.DrawLine($greenPen, 171 * $scale, 286 * $scale, 307 * $scale, 286 * $scale)

  $slatePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(100, 49, 92, 119), 22 * $scale)
  $slatePen.StartCap = $lineCap
  $slatePen.EndCap = $lineCap
  $graphics.DrawLine($slatePen, 171 * $scale, 342 * $scale, 257 * $scale, 342 * $scale)

  function Draw-Spark {
    param([float] $Cx, [float] $Cy, [float] $Outer, [float] $Inner, [int] $Alpha)

    $points = @(
      [System.Drawing.PointF]::new($Cx, $Cy - $Outer),
      [System.Drawing.PointF]::new($Cx + $Inner, $Cy - $Inner),
      [System.Drawing.PointF]::new($Cx + $Outer, $Cy),
      [System.Drawing.PointF]::new($Cx + $Inner, $Cy + $Inner),
      [System.Drawing.PointF]::new($Cx, $Cy + $Outer),
      [System.Drawing.PointF]::new($Cx - $Inner, $Cy + $Inner),
      [System.Drawing.PointF]::new($Cx - $Outer, $Cy),
      [System.Drawing.PointF]::new($Cx - $Inner, $Cy - $Inner)
    )
    $sparkPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $sparkPath.AddPolygon($points)
    $sparkBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($Alpha, 255, 255, 255))
    $graphics.FillPath($sparkBrush, $sparkPath)
    $sparkBrush.Dispose()
    $sparkPath.Dispose()
  }

  Draw-Spark (334 * $scale) (114 * $scale) (40 * $scale) (11 * $scale) 224
  Draw-Spark (116 * $scale) (376 * $scale) (32 * $scale) (9 * $scale) 184

  $stream = [System.IO.MemoryStream]::new()
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = $stream.ToArray()

  $bluePen.Dispose()
  $greenPen.Dispose()
  $slatePen.Dispose()
  $paperBrush.Dispose()
  $foldBrush.Dispose()
  $shadowBrush.Dispose()
  $shineBrush.Dispose()
  $bgBrush.Dispose()
  $iconPath.Dispose()
  $paperPath.Dispose()
  $shadowPath.Dispose()
  $foldPath.Dispose()
  $shinePath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  $stream.Dispose()

  return ,$bytes
}

$pngPath = Join-Path $publicDir "app-icon.png"
$pngBytes = [byte[]](New-AppIconPngBytes 512)
[System.IO.File]::WriteAllBytes($pngPath, $pngBytes)

$sizes = @(16, 32, 48, 64, 128, 256)
$images = @()
foreach ($size in $sizes) {
  $data = [byte[]](New-AppIconPngBytes $size)
  $images += [PSCustomObject]@{
    Size = $size
    Data = $data
  }
}

$icoPath = Join-Path $publicDir "app-icon.ico"
$fileStream = [System.IO.File]::Create($icoPath)
$writer = [System.IO.BinaryWriter]::new($fileStream)
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$images.Count)

$offset = 6 + (16 * $images.Count)
foreach ($image in $images) {
  $widthByte = if ($image.Size -eq 256) { 0 } else { $image.Size }
  $writer.Write([Byte]$widthByte)
  $writer.Write([Byte]$widthByte)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$image.Data.Length)
  $writer.Write([UInt32]$offset)
  $offset += $image.Data.Length
}

foreach ($image in $images) {
  $writer.Write([byte[]]$image.Data)
}

$writer.Dispose()
$fileStream.Dispose()

Write-Output "Generated $pngPath"
Write-Output "Generated $icoPath"
