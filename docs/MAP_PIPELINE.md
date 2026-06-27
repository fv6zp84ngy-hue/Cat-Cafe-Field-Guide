# map-creator POI Import Pipeline

This project keeps the front end static. `map-creator` should be used as an offline data/map production tool, then its POI output can be imported into `src/data/cafes.json`.

## 1. Create starter cafes from place names

When you only have a list of cat cafe names, create starter `cafes.json` first:

```bash
npm run create:cafes -- \
  --city "San Diego" \
  --places "The Cat Cafe" "Whiskers & Wine Bar" "The Cat Lounge"
```

Or use a text file:

```text
The Cat Cafe
Whiskers & Wine Bar
The Cat Lounge
```

```bash
npm run create:cafes -- --city "San Diego" --places-file places.txt
```

The starter data is intentionally marked as `needs_review` because it has names only:

```text
pinSource: needs_review
geoReview.status: needs_review
missing_coordinate
missing_image_pin
```

Use `--dry-run` to preview JSON without writing:

```bash
npm run create:cafes -- --city "San Diego" --places-file places.txt --dry-run
```

## 2. Generate POI JSON in map-creator

In the `map-creator` project, resolve cat cafe places and save a POI set:

```bash
python -m guide_maps.cli.create_gis_map \
  --city 上海 \
  --places "猫咖 A" "猫咖 B" "猫咖 C" \
  --title "上海猫咖打卡地图" \
  --save-poi-json outputs/poi_sets/shanghai_cat_cafes.json
```

The output should have this shape:

```json
{
  "city": "上海",
  "theme": "guide",
  "coordinate_policy": "AMap GCJ-02 is converted to WGS84 for OSMnx rendering",
  "pois": [
    {
      "input_name": "猫咖 A",
      "resolved_name": "猫咖 A",
      "lng_gcj02": 121.0,
      "lat_gcj02": 31.0,
      "lng_wgs84": 120.99,
      "lat_wgs84": 31.01,
      "confidence": 0.92,
      "needs_review": false,
      "candidates": []
    }
  ]
}
```

Do not commit map-creator `config.local.json`, API keys, cache, or outputs unless they are intentionally sanitized.

## 3. Import POI fields into cafes.json

Copy or reference the POI JSON path, then run from this project:

```bash
npm run import:pois -- --poi-json /path/to/outputs/poi_sets/shanghai_cat_cafes.json
```

Dry run first:

```bash
npm run import:pois -- --poi-json /path/to/outputs/poi_sets/shanghai_cat_cafes.json --dry-run
```

Optional paths:

```bash
npm run import:pois -- \
  --poi-json /path/to/poi.json \
  --cafes src/data/cafes.json \
  --out src/data/cafes.json
```

## 4. Generate starter pins from POI coordinates

After POI import, generate image-relative starter pins from WGS84 longitude/latitude:

```bash
npm run generate:pins -- --dry-run
```

Write missing pins into `src/data/cafes.json`:

```bash
npm run generate:pins
```

By default, this does not overwrite existing `mapCoords`, so manually calibrated pins are preserved.
To regenerate all pins from POI coordinates:

```bash
npm run generate:pins -- --overwrite
```

The script maps real-world coordinates into the actual illustrated-map area inside `map_north.png`.
If the generated pins are visually offset, tune the image bounds:

```bash
npm run generate:pins -- \
  --map-left 0.30 \
  --map-right 0.97 \
  --map-top 0.12 \
  --map-bottom 0.89 \
  --overwrite
```

These generated pins are only a first pass. Open `/?admin=true`, use `Move Pin`, and manually calibrate the final placement on the static image.

## 5. Style map posters with GPT Image

Use GPT Image as an offline asset-production step, not as part of the frontend runtime.

1. Upload the approved `public/map_north.png` as the rendered style reference.
2. Generate matching `map_south.png` or `Cover.png`.
3. Export PNG at 4:3 ratio.
4. Replace files in `public/`.
5. Run `npm run build`.

Detailed prompts and QA rules live in:

```text
docs/GPT_IMAGE_POSTER.md
```

Keep filenames unchanged:

```text
public/map_north.png
public/map_south.png
public/Cover.png
```

## 6. What the importer updates

For each matched cafe, the script updates:

```text
coordinatePolicy
pinSource
poi
geoReview
```

It does not overwrite:

```text
name
review
ratings
photos
cats
environmentNote
reservationNote
priceNote
visitTips
```

Matching uses cafe `name`, `address`, and `neighborhood` against map-creator `input_name`, `resolved_name`, `address`, and candidate names/addresses.

## 7. Review rules

The importer marks `geoReview.status` as `needs_review` when:

- map-creator has no WGS84 coordinates.
- the cafe has no front-end image pin.
- map-creator says `needs_review`.
- confidence is below `0.75`.

The front-end map still uses image-relative `mapCoords`. POI coordinates are the real-world GIS reference, while `mapCoords` remains the final visual placement on the illustrated/static map.

## 8. After import

1. Open `/?admin=true`.
2. Check each cafe's `POI / Geo Review` block.
3. Use `Place Pin` to visually adjust front-end map pins.
4. Run:

```bash
npm run build
```
