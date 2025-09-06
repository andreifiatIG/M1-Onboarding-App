#!/bin/bash

# M1 Villa Management - ElectricSQL Complete Setup Script

echo "🚀 Setting up ElectricSQL for M1 Villa Management System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first:"
    echo "   sudo systemctl start docker"
    echo "   sudo usermod -aG docker $USER"
    echo "   newgrp docker"
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f electric-docker-compose.yml down 2>/dev/null || true
docker stop m1-villa-electric m1-villa-postgres 2>/dev/null || true
docker rm m1-villa-electric m1-villa-postgres 2>/dev/null || true

# Check PostgreSQL configuration
echo "🔍 Checking PostgreSQL configuration..."

# Load environment variables for database password
export PGPASSWORD=taif_me

# Test database connection
if psql -U taif_me -h localhost -d ils_m1_villa_management -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
    
    # Check WAL level
    WAL_LEVEL=$(psql -U taif_me -h localhost -d ils_m1_villa_management -t -c "SHOW wal_level;" 2>/dev/null | xargs)
    echo "📊 Current WAL level: $WAL_LEVEL"
    
    # Check if electric user exists
    ELECTRIC_USER_EXISTS=$(psql -U taif_me -h localhost -d ils_m1_villa_management -t -c "SELECT COUNT(*) FROM pg_user WHERE usename = 'electric';" 2>/dev/null | xargs)
    echo "👤 Electric user exists: $([ "$ELECTRIC_USER_EXISTS" = "1" ] && echo "Yes" || echo "No")"
    
    if [ "$WAL_LEVEL" != "logical" ] || [ "$ELECTRIC_USER_EXISTS" != "1" ]; then
        echo ""
        echo "⚠️  ElectricSQL requires additional setup. Please run:"
        echo "   sudo -u postgres psql ils_m1_villa_management -f electric-setup-commands.sql"
        echo "   sudo systemctl restart postgresql"
        echo ""
        echo "Then re-run this script."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "✅ PostgreSQL is properly configured for ElectricSQL"
    fi
else
    echo "❌ Cannot connect to database. Please check PostgreSQL is running."
    exit 1
fi

# Start ElectricSQL container using docker-compose
echo "🌟 Starting ElectricSQL container..."

if docker compose -f electric-docker-compose.yml up -d; then
    echo "✅ ElectricSQL container started"
else
    echo "❌ Failed to start ElectricSQL container"
    exit 1
fi

# Wait for container to be ready
echo "⏳ Waiting for ElectricSQL to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ ElectricSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ ElectricSQL failed to start within 60 seconds"
        echo "🔍 Checking container logs:"
        docker logs m1-villa-electric
        exit 1
    fi
    sleep 2
    echo "   Attempt $i/30..."
done

# Test the Shape API
echo "🧪 Testing Shape API..."
SHAPE_TEST=$(curl -s "http://localhost:3000/v1/shape?table=Villa" | head -c 100)
if [ $? -eq 0 ]; then
    echo "✅ Shape API is responding"
    echo "📋 Sample response: ${SHAPE_TEST}..."
else
    echo "⚠️ Shape API test failed"
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker ps --filter name=m1-villa-electric --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🎉 ElectricSQL setup complete!"
echo ""
echo "🔗 Endpoints:"
echo "   Health Check: http://localhost:3000/health"
echo "   Shape API: http://localhost:3000/v1/shape?table=Villa"
echo ""
echo "🧪 Run tests with:"
echo "   npm test src/tests/electric-sql-integration.test.ts"
echo ""
echo "🔍 View logs with:"
echo "   docker logs -f m1-villa-electric"