$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$buildRoot = Join-Path $projectRoot 'dist\Nagol-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $buildRoot 'Nagol.exe'))) { throw 'Run npm run build first.' }
$archivePath = Join-Path $projectRoot 'dist\Nagol-0.1.0-windows-x64.zip'
Compress-Archive -Path $buildRoot -DestinationPath $archivePath -Force
# Use .NET directly: legacy Windows PowerShell hosts may not expose Get-FileHash.
$archiveStream = [IO.File]::OpenRead($archivePath)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
    $checksum = [BitConverter]::ToString($sha256.ComputeHash($archiveStream)).Replace('-', '').ToLowerInvariant()
} finally {
    $archiveStream.Dispose()
    $sha256.Dispose()
}
[IO.File]::WriteAllText("$archivePath.sha256", "$checksum  $([IO.Path]::GetFileName($archivePath))" + [Environment]::NewLine)
Write-Output "$checksum  $archivePath"
