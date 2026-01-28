# Quick Whisper.cpp Installation Status Checker

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Whisper.cpp Installation Status                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

cd "C:\ Users\azama\VS Code\PROJECTS\02 Startup Projects\civiclens\backend"

# Check binary
if (Test-Path ".\whisper\main.exe") {
    $exeSize = (Get-Item ".\whisper\main.exe").Length / 1MB
    Write-Host "✓ Whisper Binary: INSTALLED" -ForegroundColor Green
    Write-Host "  Location: .\whisper\main.exe" -ForegroundColor Gray
    Write-Host "  Size: $([math]::Round($exeSize, 2)) MB`n" -ForegroundColor Gray
} else {
    Write-Host "✗ Whisper Binary: NOT FOUND" -ForegroundColor Red
    Write-Host "  Expected: .\whisper\main.exe`n" -ForegroundColor Gray
}

# Check model
if (Test-Path ".\models\ggml-small.bin") {
    $modelSize = (Get-Item ".\models\ggml-small.bin").Length / 1MB
    $expectedSize = 466
    
    if ($modelSize -gt 460) {
        Write-Host "✓ Whisper Model: FULLY DOWNLOADED" -ForegroundColor Green
        Write-Host "  Location: .\models\ggml-small.bin" -ForegroundColor Gray
        Write-Host "  Size: $([math]::Round($modelSize, 2)) MB / $expectedSize MB`n" -ForegroundColor Gray
        
        Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  ✓ Installation Complete!                       ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green
        
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. .env file is already updated" -ForegroundColor White
        Write-Host "  2. Restart the backend server" -ForegroundColor White
        Write-Host "  3. Test with: node test_speech_services.js" -ForegroundColor White
        Write-Host "  4. Send voice messages to WhatsApp: +92 318 3610230`n" -ForegroundColor White
    } else {
        Write-Host "⏳ Whisper Model: DOWNLOADING..." -ForegroundColor Yellow
        Write-Host "  Location: .\models\ggml-small.bin" -ForegroundColor Gray
        Write-Host "  Progress: $([math]::Round($modelSize, 2)) MB / $expectedSize MB ($([math]::Round(($modelSize / $expectedSize) * 100, 1))%)" -ForegroundColor Gray
        Write-Host "  Estimated time: ~$([math]::Round((($expectedSize - $modelSize) / 5), 0)) seconds (assuming 5 MB/s)`n" -ForegroundColor Gray
        
        Write-Host "  Run this script again to check progress.`n" - ForegroundColor Cyan
    }
} else {
    Write-Host "✗ Whisper Model: NOT FOUND" -ForegroundColor Red
    Write-Host "  Expected: .\models\ggml-small.bin" -ForegroundColor Gray
    Write-Host "  Please run the installation command again.`n" -ForegroundColor Gray
}

# Check .env configuration
Write-Host "────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ".env Configuration:" -ForegroundColor Cyan
if (Test-Path ".\.env") {
    $envContent = Get-Content ".\.env" -Raw
    if ($envContent -match "WHISPER_BIN_PATH=./whisper/main.exe") {
        Write-Host "  ✓ WHISPER_BIN_PATH configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ WHISPER_BIN_PATH needs update" -ForegroundColor Red
    }
    
    if ($envContent -match "SPEECH_SIMULATION_MODE=false") {
        Write-Host "  ✓ Simulation mode disabled" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Simulation mode still enabled" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
}

Write-Host ""
