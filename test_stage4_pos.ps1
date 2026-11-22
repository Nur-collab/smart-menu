# E2E Test Suite for Stage 4: POS & ESC/POS Thermal Printing Integration
$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Stop"

Write-Host "=== Starting Stage 4 E2E Test Suite (POS & ESC/POS) ===" -ForegroundColor Cyan

# 1. Test GET /api/pos/config
Write-Host "`n1. Testing GET /api/pos/config..." -ForegroundColor Yellow
$configRes = Invoke-RestMethod -Uri "$baseUrl/api/pos/config" -Method GET
if (-not $configRes.config -or -not $configRes.printers) {
    throw "Failed: posConfig or printers missing in response"
}
Write-Host "  Provider: $($configRes.config.provider)" -ForegroundColor Green
Write-Host "  Printers configured: $($configRes.printers.Count)" -ForegroundColor Green

# 2. Test POST /api/pos/config
Write-Host "`n2. Testing POST /api/pos/config (Updating to iikoCloud)..." -ForegroundColor Yellow
$newConfig = @{
    posConfig = @{
        provider = "iiko"
        apiUrl = "https://api-ru.iiko.services"
        apiKey = "iiko_kg_token_prod_992"
        organizationId = "org-bishkek-cafe-01"
        terminalGroupId = "tg-hot-kitchen-01"
        autoSendOrders = $true
        autoSyncStopList = $true
        isConnected = $true
    }
} | ConvertTo-Json -Depth 5

$updateRes = Invoke-RestMethod -Uri "$baseUrl/api/pos/config" -Method POST -Body $newConfig -ContentType "application/json"
if (-not $updateRes.success) {
    throw "Failed to update POS config"
}
Write-Host "  Config updated successfully!" -ForegroundColor Green

# 3. Test POST /api/pos/sync-menu
Write-Host "`n3. Testing POST /api/pos/sync-menu (Sync with POS catalog)..." -ForegroundColor Yellow
$syncRes = Invoke-RestMethod -Uri "$baseUrl/api/pos/sync-menu" -Method POST
if (-not $syncRes.success) {
    throw "Failed to sync menu with POS"
}
Write-Host "  Menu synced! Synchronized items: $($syncRes.synchronizedItems), Stop-list items: $($syncRes.stopListCount)" -ForegroundColor Green

# 4. Create an order to test printing and POS push
Write-Host "`n4. Creating a fresh order for printing & POS test..." -ForegroundColor Yellow
$orderPayload = @{
    tableNumber = 5
    items = @(
        @{
            cartItemId = "cart-pos-1"
            menuItem = @{
                id = "plov-chayhana"
                name = "Праздничный чайханский плов"
                price = 450
                category = "mains"
                description = "Традиционный плов с бараниной и казы"
                imageUrl = "/images/plov.jpg"
                isVegetarian = $false
                isSpicy = $false
                isPopular = $true
                cookingTimeMinutes = 20
                calories = 720
                allergens = @()
                weightGrams = 400
            }
            quantity = 2
            selectedOptions = @(
                @{
                    groupId = "meat"
                    groupName = "Мясо"
                    optionId = "lamb"
                    optionName = "Казы по-чуйски"
                    priceDelta = 80
                }
            )
            unitPrice = 530
        }
    )
    totalAmount = 1060
    serviceFee = 159
    finalAmount = 1219
    paymentMethod = "elqr"
    guestComment = "Приготовить к 15:30, без лука"
} | ConvertTo-Json -Depth 6

$orderRes = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method POST -Body $orderPayload -ContentType "application/json"
$createdOrderId = $orderRes.data.id
Write-Host "  Created order: $createdOrderId for Table 5" -ForegroundColor Green

# 5. Test POST /api/printer/print-ticket
Write-Host "`n5. Testing POST /api/printer/print-ticket (ESC/POS Thermal Engine)..." -ForegroundColor Yellow
$printPayload = @{
    orderId = $createdOrderId
} | ConvertTo-Json

$printRes = Invoke-RestMethod -Uri "$baseUrl/api/printer/print-ticket" -Method POST -Body $printPayload -ContentType "application/json"
if (-not $printRes.success) {
    throw "Failed to print ticket"
}
Write-Host "  ESC/POS Ticket printed!" -ForegroundColor Green
Write-Host "  Printer: $($printRes.printerName) ($($printRes.ipAddress))" -ForegroundColor Green
Write-Host "  Binary bytes count: $($printRes.bytesCount) bytes" -ForegroundColor Green
Write-Host "  --- ESC/POS Ticket Preview ---" -ForegroundColor DarkGray
Write-Host $printRes.textPreview -ForegroundColor Cyan
Write-Host "  ------------------------------" -ForegroundColor DarkGray

# 6. Test POST /api/pos/send-order
Write-Host "`n6. Testing POST /api/pos/send-order (iikoCloud / Poster gateway)..." -ForegroundColor Yellow
$posOrderPayload = @{
    orderId = $createdOrderId
} | ConvertTo-Json

$posSendRes = Invoke-RestMethod -Uri "$baseUrl/api/pos/send-order" -Method POST -Body $posOrderPayload -ContentType "application/json"
if (-not $posSendRes.success) {
    throw "Failed to send order to POS"
}
Write-Host "  Order sent to $($posSendRes.provider)! POS Order ID: $($posSendRes.posOrderId)" -ForegroundColor Green

# 7. Test GET /api/pos/logs
Write-Host "`n7. Testing GET /api/pos/logs (Audit Trail)..." -ForegroundColor Yellow
$logsRes = Invoke-RestMethod -Uri "$baseUrl/api/pos/logs" -Method GET
if (-not $logsRes.logs -or $logsRes.logs.Count -eq 0) {
    throw "Audit logs are empty"
}
Write-Host "  Total audit logs: $($logsRes.logs.Count)" -ForegroundColor Green
$latestLog = $logsRes.logs[0]
Write-Host "  Latest action: $($latestLog.type) -> $($latestLog.status) ($($latestLog.message))" -ForegroundColor Green

Write-Host "`n>>> ALL STAGE 4 TESTS COMPLETED SUCCESSFULLY! POS & ESC/POS ARE FULLY FUNCTIONAL! <<<" -ForegroundColor Green
