# Test Hierarchy and Speech Services

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Testing CivicLens Services                             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test 1: Speech Services
Write-Host "📝 Running Speech Services Tests..." -ForegroundColor Yellow
node test_speech_services.js

# Test 2: Hierarchy Endpoints
Write-Host "`n`n🌐 Testing Hierarchy API Endpoints..." -ForegroundColor Yellow

$baseUrl = "http://localhost:3000/api/v1"
$token = $env:TEST_TOKEN

if (-not $token) {
    Write-Host "⚠️  TEST_TOKEN not set. Using guest access..." -ForegroundColor Yellow
}

$headers = @{
    "Content-Type" = "application/json"
}

if ($token) {
    $headers["Authorization"] = "Bearer $token"
}

# Test getTowns
Write-Host "`nTesting GET /hierarchy/towns..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/hierarchy/towns" -Headers $headers -Method Get
    Write-Host "✅ Success: Found $($response.count) towns" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Test getUCs
Write-Host "`nTesting GET /hierarchy/ucs..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/hierarchy/ucs" -Headers $headers -Method Get
    Write-Host "✅ Success: Found $($response.count) UCs" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Test getCities
Write-Host "`nTesting GET /hierarchy/cities..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/hierarchy/cities" -Headers $headers -Method Get
    Write-Host "✅ Success: Found $($response.count) cities" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host "`n`n✨ Tests Complete!" -ForegroundColor Green
Write-Host "`nℹ️  If you see authentication errors, set TEST_TOKEN:" -ForegroundColor Cyan
Write-Host '   $env:TEST_TOKEN = "your_jwt_token_here"' -ForegroundColor Gray
Write-Host "`n   Get token by logging in at: http://localhost:5173/login`n" -ForegroundColor Gray
