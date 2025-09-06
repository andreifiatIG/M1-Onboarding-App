#!/bin/bash

echo "🧪 Testing SharePoint API Endpoints"
echo "=================================="

BASE_URL="http://localhost:4001"

echo "1️⃣ Testing SharePoint folder creation via API..."
echo

# Test villa folder creation
curl -X POST "${BASE_URL}/api/villas/test-villa-123/folders" \
  -H "Content-Type: application/json" \
  -d '{
    "villaName": "Test Villa API",
    "villaId": "test-villa-123"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo
echo "2️⃣ Testing direct SharePoint service status..."

# Test service status
curl -X GET "${BASE_URL}/api/sharepoint/status" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo
echo "3️⃣ Testing SharePoint folder listing..."

# Test folder listing
curl -X GET "${BASE_URL}/api/sharepoint/folders" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s

echo
echo "✅ SharePoint API tests completed"