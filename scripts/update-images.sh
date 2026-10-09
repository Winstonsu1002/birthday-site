#!/usr/bin/env bash
# Converts any PNG/JPG in images/ to WebP (originals moved to originals/),
# then regenerates images.json. Requires: cwebp (brew install webp), jq.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p images originals
shopt -s nullglob nocaseglob

for f in images/*.png images/*.jpg images/*.jpeg; do
  base=$(basename "${f%.*}")
  slug=$(printf '%s' "$base" | perl -CSD -pe '$_ = lc; s/[^\p{L}\p{N}]+/-/g; s/^-+|-+$//g')
  [ -n "$slug" ] || slug="image-$(date +%s)"
  cwebp -quiet -q 70 -m 6 -sharp_yuv "$f" -o "images/$slug.webp"
  mv "$f" originals/
  echo "converted: $f -> images/$slug.webp"
done

ls images | grep -iE '\.(webp|gif|avif)$' | sort \
  | jq -R 'select(length > 0) | "images/" + .' | jq -s '.' > images.json

echo "images.json: $(jq length images.json) images"
