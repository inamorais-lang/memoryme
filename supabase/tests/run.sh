#!/usr/bin/env bash
# Runs the migrations + SQL tests on a throwaway database in a plain Postgres.
# Usage: PGHOST=... PGPORT=... supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=memoryme_test_$$
psql -U postgres -qc "create database $DB" >/dev/null
trap 'psql -U postgres -qc "drop database if exists $DB" >/dev/null' EXIT
run() { psql -U postgres -d "$DB" -q -v ON_ERROR_STOP=1 -f "$1"; }
run tests/00_stub_supabase.sql
for f in migrations/*.sql; do run "$f"; done
# Results come as NOTICEs on stderr; query output is noise.
run tests/01_security_and_credits.sql 2>&1 >/dev/null | sed 's/^psql:[^ ]* NOTICE:  /  /'
echo "ALL TESTS PASSED"
