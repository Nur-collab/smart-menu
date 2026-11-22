# E2E Test Suite for Stage 5: AI Sommelier, Dynamic Pricing & Multilingual Experience
$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Stop"

Write-Host "=== Starting Stage 5 E2E Test Suite (AI Sommelier & Dynamic Menu) ===" -ForegroundColor Cyan

# 1. Test AI Sommelier in Russian (RU)
Write-Host "`n1. Testing AI Sommelier (Russian - 'Что взять к кофе без сахара?')..." -ForegroundColor Yellow
$hRu = @{
    message = "Что посоветуете к кофе без сахара?"
    language = "ru"
    cartItemIds = @()
}
$bodyRu = $hRu | ConvertTo-Json

$resRu = Invoke-RestMethod -Uri "$baseUrl/api/ai/sommelier" -Method POST -Body $bodyRu -ContentType "application/json"
if (-not $resRu.success -or -not $resRu.reply -or $resRu.recommendedItems.Count -eq 0) {
    throw "Failed Russian AI sommelier response"
}
Write-Host "  AI Sommelier Reply (RU):" -ForegroundColor Green
Write-Host "  $($resRu.reply)" -ForegroundColor DarkGray
Write-Host "  Recommended dishes: $($resRu.recommendedItems.name -join ', ')" -ForegroundColor Green
Write-Host "  Quick prompts: $($resRu.quickPrompts -join ' | ')" -ForegroundColor DarkCyan

# 2. Test AI Sommelier in Kyrgyz (KG)
Write-Host "`n2. Testing AI Sommelier (Kyrgyz - 'Тоюмдуу ысык тамак сунуштаңыз')..." -ForegroundColor Yellow
$hKg = @{
    message = "Тоюмдуу ысык тамак сунуштаңыз"
    language = "kg"
    cartItemIds = @()
}
$bodyKg = $hKg | ConvertTo-Json

$resKg = Invoke-RestMethod -Uri "$baseUrl/api/ai/sommelier" -Method POST -Body $bodyKg -ContentType "application/json"
if (-not $resKg.success -or -not $resKg.reply -or $resKg.recommendedItems.Count -eq 0) {
    throw "Failed Kyrgyz AI sommelier response"
}
Write-Host "  AI Sommelier Reply (KG):" -ForegroundColor Green
Write-Host "  $($resKg.reply)" -ForegroundColor DarkGray
Write-Host "  Recommended dishes: $($resKg.recommendedItems.name -join ', ')" -ForegroundColor Green

# 3. Test AI Sommelier in English (EN)
Write-Host "`n3. Testing AI Sommelier (English - 'Looking for a vegan gluten free lunch')..." -ForegroundColor Yellow
$hEn = @{
    message = "Looking for a vegan gluten free healthy lunch"
    language = "en"
    cartItemIds = @()
}
$bodyEn = $hEn | ConvertTo-Json

$resEn = Invoke-RestMethod -Uri "$baseUrl/api/ai/sommelier" -Method POST -Body $bodyEn -ContentType "application/json"
if (-not $resEn.success -or -not $resEn.reply -or $resEn.recommendedItems.Count -eq 0) {
    throw "Failed English AI sommelier response"
}
Write-Host "  AI Sommelier Reply (EN):" -ForegroundColor Green
Write-Host "  $($resEn.reply)" -ForegroundColor DarkGray
Write-Host "  Recommended dishes: $($resEn.recommendedItems.name -join ', ')" -ForegroundColor Green

# 4. Test Cart Context Awareness
Write-Host "`n4. Testing Cart-Aware Smart Pairings (Item already in cart)..." -ForegroundColor Yellow
$hCart = @{
    message = "Что-то к плову и мясу"
    language = "ru"
    cartItemIds = @("item-5")
}
$bodyCartAware = $hCart | ConvertTo-Json

$resCart = Invoke-RestMethod -Uri "$baseUrl/api/ai/sommelier" -Method POST -Body $bodyCartAware -ContentType "application/json"
if (-not $resCart.success -or $resCart.recommendedItems.Count -eq 0) {
    throw "Failed Cart-Aware AI sommelier response"
}
Write-Host "  Cart has item-5. Sommelier recommended fresh pairings:" -ForegroundColor Green
Write-Host "  $($resCart.recommendedItems.name -join ', ')" -ForegroundColor Green

# 5. Check Guest Page availability
Write-Host "`n5. Verifying Guest Page with Multilingual & AI widgets..." -ForegroundColor Yellow
$pageRes = Invoke-WebRequest -Uri "$baseUrl/" -Method GET
if ($pageRes.StatusCode -ne 200) {
    throw "Failed to load guest page"
}
Write-Host "  Guest page loads with status 200 OK! Length: $($pageRes.Content.Length) bytes" -ForegroundColor Green

Write-Host "`n>>> ALL STAGE 5 TESTS COMPLETED SUCCESSFULLY! AI SOMMELIER & DYNAMIC MENU ARE LIVE! <<<" -ForegroundColor Green
