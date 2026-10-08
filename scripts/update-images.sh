#!/usr/bin/env bash
# Converts any PNG/JPG in images/ to WebP (originals moved to originals/),
# then regenerates images.json. Requires: cwebp (brew install webp), jq.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p images originals
shopt -s nullglob nocaseglob

for f in images/*.png images/*.jpg images/*.jpeg; do
  base=$(basename "${f%.*}")
  slug=$(echo "$base" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g')
  cwebp -quiet -q 85 "$f" -o "images/$slug.webp"
  mv "$f" originals/
  echo "converted: $f -> images/$slug.webp"
done

ls images | grep -iE '\.(webp|gif|avif)$' | sort \
  | jq -R 'select(length > 0) | "images/" + .' | jq -s '.' > images.json

echo "images.json: $(jq length images.json) images"
