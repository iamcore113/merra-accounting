#!/usr/bin/env bash

set -euo pipefail

echo "=========================================="
echo " Starting External Resources for Merra    "
echo "=========================================="

# Locate wslc executable
WSLC_CMD=""
if command -v wslc.exe >/dev/null 2>&1; then
    WSLC_CMD="wslc.exe"
elif [ -f "/mnt/c/Program Files/WSL/wslc.exe" ]; then
    WSLC_CMD="/mnt/c/Program Files/WSL/wslc.exe"
else
    echo "Error: wslc.exe not found in PATH or '/mnt/c/Program Files/WSL/'."
    exit 1
fi

# 1. Start Redis Stack
echo -n "Checking Redis Stack container... "
if "$WSLC_CMD" ps < /dev/null 2>&1 | grep -q "redis-stack"; then
    echo "already running."
elif "$WSLC_CMD" ps -a < /dev/null 2>&1 | grep -q "redis-stack"; then
    echo "starting stopped container..."
    "$WSLC_CMD" start redis-stack < /dev/null >/dev/null
    echo "✓ redis-stack started."
else
    echo "creating new container..."
    "$WSLC_CMD" run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack redis-server --requirepass merra_account_rds < /dev/null >/dev/null
    echo "✓ redis-stack created and started."
fi

# 2. Start SeaweedFS
echo -n "Checking SeaweedFS container... "
if "$WSLC_CMD" ps < /dev/null 2>&1 | grep -q "seaweedfs"; then
    echo "already running."
elif "$WSLC_CMD" ps -a < /dev/null 2>&1 | grep -q "seaweedfs"; then
    echo "starting stopped container..."
    "$WSLC_CMD" start seaweedfs < /dev/null >/dev/null
    echo "✓ seaweedfs started."
else
    echo "creating new container..."
    "$WSLC_CMD" run -d --name seaweedfs -p 8333:8333 -p 8888:8888 chrislusf/seaweedfs mini -dir=/data < /dev/null >/dev/null
    echo "✓ seaweedfs created and started."
fi

# 3. Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v pg_isready >/dev/null 2>&1 && pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "accepting connections."
else
    echo "not running. Attempting to start PostgreSQL service..."
    sudo service postgresql start 2>/dev/null || true
fi

echo "------------------------------------------"
echo "Verifying service endpoints:"

# Health check Redis
if python3 -c "import socket; s = socket.socket(); s.settimeout(2); s.connect(('localhost', 6379)); s.sendall(b'AUTH merra_account_rds\r\nPING\r\n'); res = s.recv(1024); s.close(); exit(0 if b'PONG' in res else 1)" 2>/dev/null; then
    echo " [OK] Redis Stack  -> localhost:6379 (Web UI: http://localhost:8001)"
else
    echo " [FAIL] Could not connect to Redis on localhost:6379"
fi

# Health check SeaweedFS
if python3 -c "import socket; s = socket.socket(); s.settimeout(2); s.connect(('localhost', 8333)); s.sendall(b'GET / HTTP/1.1\r\nHost: localhost:8333\r\n\r\n'); res = s.recv(1024); s.close(); exit(0 if b'HTTP/1.1' in res else 1)" 2>/dev/null; then
    echo " [OK] SeaweedFS S3 -> http://localhost:8333 (Filer UI: http://localhost:8888)"
else
    echo " [FAIL] Could not connect to SeaweedFS on http://localhost:8333"
fi

echo "=========================================="
echo "Ready! You can now run ./run-main-jar.sh"
echo "=========================================="

