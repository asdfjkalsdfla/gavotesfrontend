#!/usr/bin/env bash
set -euo pipefail

MAX_REVISIONS="${1:-10}"

expire_old_assets() {
  local s3_assets_path="$1"
  echo "Checking ${s3_assets_path}/ for assets older than ${MAX_REVISIONS} revisions (by index-*.js timestamp)..."

  local listing
  listing=$(aws s3 ls "${s3_assets_path}/" || true)
  if [ -z "$listing" ]; then
    return 0
  fi

  # Each build produces one index-<hash>.js. Find the timestamp of the MAX_REVISIONS-th newest index-*.js.
  local oldest_kept_ts
  oldest_kept_ts=$(printf '%s\n' "$listing" \
    | awk '$1 ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/ && $4 ~ /^index-.*\.js$/ { print $1, $2 }' \
    | sort -ru \
    | sed -n "${MAX_REVISIONS}p")

  if [ -z "$oldest_kept_ts" ]; then
    echo "No expired asset revisions found in ${s3_assets_path}/ (<= ${MAX_REVISIONS} index-*.js revisions present)."
    return 0
  fi

  # Subtract 30 seconds so other chunks uploaded slightly earlier in that same sync are kept.
  local cutoff_ts
  if cutoff_ts=$(date -j -v-30S -f "%Y-%m-%d %H:%M:%S" "$oldest_kept_ts" "+%Y-%m-%d %H:%M:%S" 2>/dev/null); then
    :
  else
    cutoff_ts=$(date -d "${oldest_kept_ts} - 30 seconds" "+%Y-%m-%d %H:%M:%S")
  fi

  local expired_files
  expired_files=$(printf '%s\n' "$listing" \
    | awk -v cutoff="$cutoff_ts" '$1 ~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/ && $4 != "" && ($1 " " $2) < cutoff { print $4 }')

  if [ -z "$expired_files" ]; then
    echo "No assets in ${s3_assets_path}/ older than ${cutoff_ts}."
    return 0
  fi

  echo "Expiring assets in ${s3_assets_path}/ older than ${cutoff_ts}..."
  printf '%s\n' "$expired_files" | while IFS= read -r file; do
    aws s3 rm "${s3_assets_path}/${file}"
  done
}

expire_old_assets "s3://georgiavotesvisual-latest/assets"

aws s3 sync s3://georgiavotesvisual-latest/assets s3://georgiavotesvisual/assets --delete
aws s3 cp s3://georgiavotesvisual-latest/index.html s3://georgiavotesvisual/index.html
# aws s3 sync s3://georgiavotesvisual-latest/static s3://georgiavotesvisual/static

expire_old_assets "s3://georgiavotesvisual/assets"

aws cloudfront create-invalidation --distribution-id EE4GWZ043VGRF --paths "/*"

