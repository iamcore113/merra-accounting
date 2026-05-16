#!/bin/bash

# Script to delete all records from all tables in merradb database
# Uses docker exec to run psql from inside the postgres container

CONTAINER_NAME="merra-db"
DB_NAME="merradb"
DB_USER="merra-user"

echo "Connecting to database ${DB_NAME} in container ${CONTAINER_NAME}..."

# Check if container is running
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "Error: Container ${CONTAINER_NAME} is not running. Start it with: docker compose up -d db"
    exit 1
fi

echo "Listing all tables in merra_schema:"
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT schemaname, tablename, pg_catalog.pg_total_relation_size(schemaname||'.'||tablename) AS size
FROM pg_tables
WHERE schemaname = 'merra_schema'
ORDER BY tablename;"

echo ""
echo "Truncating all tables..."

# Get all table names in the merra_schema schema and truncate them
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "
SELECT schemaname || '.' || tablename
FROM pg_tables
WHERE schemaname = 'merra_schema'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%';
" | while read -r table; do
    # Trim whitespace
    table=$(echo "${table}" | xargs)
    if [ -n "${table}" ]; then
        echo "Truncating ${table}..."
        docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "TRUNCATE TABLE ${table} CASCADE;"
    fi
done

echo "All records deleted from merradb tables."
