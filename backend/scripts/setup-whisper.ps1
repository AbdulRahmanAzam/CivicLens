# CivicLens Whisper.cpp Setup Script
# Downloads and configures Whisper.cpp for speech recognition

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CivicLens Whisper.cpp Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$WhisperDir = ".\whisper"
$ModelsDir = ".\models"
$TempDir = ".\temp"
$WhisperRelease = "https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip"
$ModelUrl = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"

# Create directories
Write-Host "[1/5] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $WhisperDir | Out-Null
New-Item -ItemType Directory -Force -Path $ModelsDir | Out-Null
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
Write-Host "  ✓ Directories created" -ForegroundColor Green

# Download Whisper.cpp binary
Write-Host "`n[2/5] Downloading Whisper.cpp binary..." -ForegroundColor Yellow
$ZipPath = "$TempDir\whisper.zip"

try {
    # Use curl for better download progress
    curl.exe -L -o $ZipPath $WhisperRelease --progress-bar
    Write-Host "  ✓ Downloaded whisper.cpp" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Failed to download whisper.cpp" -ForegroundColor Red
    Write-Host "    Manual download: $WhisperRelease" -ForegroundColor Yellow
    exit 1
}

# Extract whisper binary
Write-Host "`n[3/5] Extracting Whisper.cpp..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
    
    # Find and move the main executable
    $MainExe = Get-ChildItem -Path $TempDir -Recurse -Filter "main.exe" | Select-Object -First 1
    if ($MainExe) {
        Copy-Item $MainExe.FullName -Destination "$WhisperDir\main.exe" -Force
        Write-Host "  ✓ Extracted main.exe to $WhisperDir" -ForegroundColor Green
    } else {
        # Try whisper.exe
        $WhisperExe = Get-ChildItem -Path $TempDir -Recurse -Filter "whisper.exe" | Select-Object -First 1
        if ($WhisperExe) {
            Copy-Item $WhisperExe.FullName -Destination "$WhisperDir\main.exe" -Force
            Write-Host "  ✓ Extracted whisper.exe as main.exe to $WhisperDir" -ForegroundColor Green
        } else {
            Write-Host "  ! No executable found, copying all contents" -ForegroundColor Yellow
            Copy-Item "$TempDir\*" -Destination $WhisperDir -Recurse -Force
        }
    }
}
catch {
    Write-Host "  ✗ Failed to extract: $_" -ForegroundColor Red
    exit 1
}

# Download model
Write-Host "`n[4/5] Downloading Whisper model (ggml-small.bin ~466MB)..." -ForegroundColor Yellow
Write-Host "       This may take a few minutes..." -ForegroundColor Gray
$ModelPath = "$ModelsDir\ggml-small.bin"

try {
    curl.exe -L -o $ModelPath $ModelUrl --progress-bar
    Write-Host "  ✓ Downloaded ggml-small.bin" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Failed to download model" -ForegroundColor Red
    Write-Host "    Manual download: $ModelUrl" -ForegroundColor Yellow
    exit 1
}

# Cleanup
Write-Host "`n[5/5] Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Cleanup complete" -ForegroundColor Green

# Update .env
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Files installed:" -ForegroundColor White
Write-Host "  - $WhisperDir\main.exe" -ForegroundColor Gray
Write-Host "  - $ModelsDir\ggml-small.bin" -ForegroundColor Gray

Write-Host "`nUpdate your .env file:" -ForegroundColor Yellow
Write-Host "  WHISPER_BIN_PATH=./whisper/main.exe" -ForegroundColor Gray
Write-Host "  WHISPER_MODEL_PATH=./models/ggml-small.bin" -ForegroundColor Gray
Write-Host "  SPEECH_SIMULATION_MODE=false" -ForegroundColor Gray

Write-Host "`nRestart the server to enable speech recognition!`n" -ForegroundColor Cyan
