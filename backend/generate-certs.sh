#!/bin/bash
set -e

# Directory for certs
CERTS_DIR="$(dirname "$0")/certs"
mkdir -p "$CERTS_DIR"

echo "Generating certificates in $CERTS_DIR..."

# Generate CA
openssl genrsa -out "$CERTS_DIR/ca.key" 2048
openssl req -x509 -new -nodes -key "$CERTS_DIR/ca.key" -sha256 -days 3650 -subj "/CN=Merra CA" -out "$CERTS_DIR/ca.crt"

# Generate Redis Server Key
openssl genrsa -out "$CERTS_DIR/redis.key" 2048

# Create CSR config for SANs (to allow connecting via 'localhost' and 'redis')
cat > "$CERTS_DIR/redis.conf" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = redis

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = redis
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

# Generate CSR
openssl req -new -key "$CERTS_DIR/redis.key" -out "$CERTS_DIR/redis.csr" -config "$CERTS_DIR/redis.conf"

# Sign Redis Server Certificate
openssl x509 -req -in "$CERTS_DIR/redis.csr" -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial -out "$CERTS_DIR/redis.crt" -days 3650 -sha256 -extensions v3_req -extfile "$CERTS_DIR/redis.conf"

# Clean up CSR and temp config
rm "$CERTS_DIR/redis.csr" "$CERTS_DIR/redis.conf"

# Set permissions
chmod 644 "$CERTS_DIR"/*

echo "Certificates generated successfully!"
