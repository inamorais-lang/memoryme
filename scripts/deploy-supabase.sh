#!/usr/bin/env bash
# Publishes the database migrations and Edge Functions to a Supabase project
# through the Management API (works without a direct Postgres connection).
#
# Usage: SUPABASE_PROJECT_REF=xxxx SUPABASE_ACCESS_TOKEN=sbp_... scripts/deploy-supabase.sh
# Migrations already applied (tracked in supabase_migrations.schema_migrations) are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."

REF="${SUPABASE_PROJECT_REF:?set SUPABASE_PROJECT_REF}"
TOKEN="${SUPABASE_ACCESS_TOKEN:?set SUPABASE_ACCESS_TOKEN}"
API="https://api.supabase.com/v1/projects/$REF"

query() {
  python3 -c 'import json,sys; print(json.dumps({"query": sys.stdin.read()}))' |
    curl -sS --fail-with-body -X POST "$API/database/query" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @-
}

echo "→ migration history table"
echo "create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, statements text[]);" | query >/dev/null

applied=$(echo "select coalesce(json_agg(version), '[]') as v from supabase_migrations.schema_migrations;" | query)

for file in supabase/migrations/*.sql; do
  name=$(basename "$file" .sql)
  version=${name%%_*}
  if echo "$applied" | grep -q "\"$version\""; then
    echo "✓ $name (already applied)"
    continue
  fi
  echo "→ applying $name"
  { echo "begin;"; cat "$file"; echo; echo "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '${name#*_}');"; echo "commit;"; } | query >/dev/null
  echo "✓ $name"
done

echo "→ deploying Edge Functions"
for fn in generate new-phrase delete-account delete-image verify-purchase admin-grant admin-trends admin-reports; do
  npx -y supabase@2 functions deploy "$fn" --project-ref "$REF" --use-api
done
# Called by pg_cron (no user JWT; it can only delete originals older than 23 h).
for fn in cleanup-originals apple-notifications; do
  npx -y supabase@2 functions deploy "$fn" --project-ref "$REF" --use-api --no-verify-jwt
done

echo "→ secrets present on the project"
curl -sS "$API/secrets" -H "Authorization: Bearer $TOKEN" | python3 -c 'import json,sys; print(sorted(s["name"] for s in json.load(sys.stdin)))'
echo "Done."
