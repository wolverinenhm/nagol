$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$buildRoot = Join-Path $projectRoot 'dist\Nagol-win-x64'
if (-not (Test-Path -LiteralPath (Join-Path $buildRoot 'Nagol.exe'))) { throw 'Run npm run build first.' }
$archivePath = Join-Path $projectRoot 'dist\Nagol-0.1.0-windows-x64.zip'
Compress-Archive -Path $buildRoot -DestinationPath $archivePath -Force
Get-FileHash -LiteralPath $archivePath -Algorithm SHA256
