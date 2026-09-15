#!/usr/bin/env bash
set -euo pipefail

output="${1:-dist/weather-window.zip}"
required=(
  settings.yml
  full.liquid
  half_horizontal.liquid
  half_vertical.liquid
  quadrant.liquid
  shared.liquid
  transform.js
)

for file in "${required[@]}"; do
  if [[ ! -f "src/$file" ]]; then
    echo "Missing required package file: src/$file" >&2
    exit 1
  fi
done

output_dir="$(dirname "$output")"
mkdir -p "$output_dir"
output_abs="$(cd "$output_dir" && pwd)/$(basename "$output")"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

for file in "${required[@]}"; do
  cp "src/$file" "$stage/$file"
done

(
  cd "$stage"
  zip -X -q "$output_abs" "${required[@]}"
)

mapfile -t actual < <(unzip -Z1 "$output_abs" | sort)
mapfile -t expected < <(printf '%s\n' "${required[@]}" | sort)

if [[ "${actual[*]}" != "${expected[*]}" ]]; then
  echo "Unexpected ZIP manifest:" >&2
  printf '  %s\n' "${actual[@]}" >&2
  exit 1
fi

if unzip -Z1 "$output_abs" | grep -q '/'; then
  echo "Package files must be at archive root" >&2
  exit 1
fi

unzip -t "$output_abs"
echo "Created $output_abs"
