#!/usr/bin/env bash
# Builds the web copies in /media from the raw originals in /images.
#
#   images/  raw phone photos and videos (NOT deployed: they carry GPS data and are huge)
#   media/   small, metadata-free copies the site actually loads
#
# To add or swap media: edit the MEDIA list below, then run
#   ./scripts/optimize-media.sh          (everything)
#   ./scripts/optimize-media.sh car      (only slugs starting with "car")
# Tiles in index.html point at /media/<slug>.*; project pages (projects/*.html) list their gallery files.
#
# Needs: sips (built into macOS), cwebp, ffmpeg  ->  brew install webp ffmpeg
set -euo pipefail
cd "$(dirname "$0")/.."

# kind   slug                       source file, relative to images/   [optional: extra clockwise turn, degrees]
MEDIA="
photo  tars                         tars/tars.webp
video  robotic-air-hockey-table     robotairhockey/robotairhockey.gif
video  voron-02-3d-printer          voron0.2/printing.MOV
video  vid2cad                      vid2cad/vid2cad.mp4
photo  car-restoration              carrestore/thumbnail.JPG
photo  headshot                     headshot/headshot.PNG

# project page galleries -> media/<project>/<name>.webp + <name>-thumb.webp (videos: .mp4 + .webp poster)
gallery tars/full-tars               tars/fullTars.jpeg
gallery tars/prototype               tars/tarsPrototype.jpg
gallery tars/cycloidal-design        tars/cycloidalDesign.jpg
gallery tars/cycloidal-assembly      tars/cycloidalAssembly.jpg
gallery tars/full-cycloidal-assembly tars/fullCycloidalAssembly.jpg
gallery tars/cycloidal-mounted       tars/cycloidalMounted.jpg   90
gallery tars/gearboxes               tars/gearboxes.jpg
gallery tars/build                   tars/IMG_2576.jpeg
gallery tars/smarter-every-day       tars/photowithSmarterEveryday.jpeg
gallery voron/printer                voron0.2/thumbnail.JPG
gallery voron/left-belts             voron0.2/leftbelts.JPG
gallery voron/right-belts            voron0.2/rightbelts.JPG
gallery voron/side-belt              voron0.2/sidebelt.JPG
video   voron/belt-test              voron0.2/belttest.MOV
gallery vid2cad/architecture         vid2cad/figure_architecture.png
gallery vid2cad/data-funnel          vid2cad/fig_data_funnel.png
gallery vid2cad/results              vid2cad/gt_vs_pred_grid.png
gallery car/teardown                 carrestore/IMG_7385.JPG
gallery car/night-work               carrestore/IMG_7268.JPG
gallery car/brakes                   carrestore/IMG_7444.JPG
gallery car/headlights               carrestore/IMG_7391.JPG
gallery car/head-unit-wiring         carrestore/IMG_7513.JPG
gallery car/dash-screen              carrestore/IMG_7388.JPG
gallery car/side                     carrestore/IMG_7503.JPG
gallery car/rear                     carrestore/IMG_7504.JPG
"

PHOTO_MAX=1600   # longest edge of a photo, in pixels
VIDEO_MAX=960    # widest a video gets, in pixels
OUT=media
ONLY=${1:-}      # optional slug prefix
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# photo -> media/<slug>.webp (upright, at most PHOTO_MAX px, no metadata)
photo() {
  local src=$1 dst=$2 w h o
  sips -s format png "$src" --out "$TMP/p.png" >/dev/null
  # bake in the EXIF rotation, since the WebP drops the tag
  o=$(sips -g orientation "$src" | awk '/orientation/ {print $2}')
  case "$o" in
    3) sips -r 180 "$TMP/p.png" >/dev/null ;;
    6) sips -r 90  "$TMP/p.png" >/dev/null ;;
    8) sips -r 270 "$TMP/p.png" >/dev/null ;;
  esac
  # extra turn from the MEDIA list, for photos the camera saved sideways
  if [ -n "${ROT:-}" ]; then sips -r "$ROT" "$TMP/p.png" >/dev/null; fi
  w=$(sips -g pixelWidth  "$TMP/p.png" | awk '/pixelWidth/  {print $2}')
  h=$(sips -g pixelHeight "$TMP/p.png" | awk '/pixelHeight/ {print $2}')
  if (( w > PHOTO_MAX || h > PHOTO_MAX )); then sips -Z "$PHOTO_MAX" "$TMP/p.png" >/dev/null; fi
  cwebp -quiet -q 80 -metadata none "$TMP/p.png" -o "$dst"
}

# gallery photo -> media/<slug>.webp (enlarged view) + media/<slug>-thumb.webp (640px wide, for the grid)
gallery() {
  local src=$1 dst=$2 thumb=$3
  photo "$src" "$dst"
  cwebp -quiet -q 75 -resize 640 0 -metadata none "$TMP/p.png" -o "$thumb"
}

# video -> media/<slug>.mp4 (silent H.264 loop, at most VIDEO_MAX wide, no metadata)
#        + media/<slug>.webp poster (first frame, shown before the video loads)
video() {
  local src=$1 dst=$2 poster=$3
  ffmpeg -nostdin -v error -y -i "$src" -map_metadata -1 -an \
    -vf "scale='min($VIDEO_MAX,iw)':-2:flags=lanczos,format=yuv420p" \
    -c:v libx264 -preset slow -crf 28 -profile:v high -movflags +faststart "$dst"
  ffmpeg -nostdin -v error -y -i "$dst" -frames:v 1 "$TMP/poster.png"
  cwebp -quiet -q 78 -metadata none "$TMP/poster.png" -o "$poster"
}

echo "$MEDIA" | while read -r kind slug src ROT; do
  [ -z "${kind:-}" ] || [ "${kind:0:1}" = "#" ] && continue
  [ -n "$ONLY" ] && [ "${slug#"$ONLY"}" = "$slug" ] && continue
  mkdir -p "$(dirname "$OUT/$slug")"
  if [ ! -f "images/$src" ]; then echo "skip  $slug (missing images/$src)"; continue; fi
  case "$kind" in
    photo) photo "images/$src" "$OUT/$slug.webp" ;;
    gallery) gallery "images/$src" "$OUT/$slug.webp" "$OUT/$slug-thumb.webp" ;;
    video) video "images/$src" "$OUT/$slug.mp4" "$OUT/$slug.webp" ;;
  esac
  printf 'done  %-30s %s\n' "$slug" "$(du -ch "$OUT/$slug".* "$OUT/$slug"-thumb.* 2>/dev/null | tail -1 | cut -f1)"
done
