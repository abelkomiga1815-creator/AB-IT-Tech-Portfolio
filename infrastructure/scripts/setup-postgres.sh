#!/usr/bin/env bash
# Creates the local PostgreSQL role and database used for development.
# Usage:  DB_PASSWORD='choose-a-password' ./infrastructure/scripts/setup-postgres.sh
set -euo pipefail

DB_NAME="${POSTGRES_DB:-ab_portfolio}"
DB_USER="${POSTGRES_USER:-ab_portfolio}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD (it must match POSTGRES_PASSWORD in your .env)}"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}' CREATEDB;
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}' CREATEDB;
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

echo "PostgreSQL role '${DB_USER}' and database '${DB_NAME}' are ready (CREATEDB lets Django create its test database)."
