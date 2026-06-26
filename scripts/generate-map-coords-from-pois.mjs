#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULT_CAFES = 'src/data/cafes.json'

function parseArgs(argv) {
  const args = {
    cafes: DEFAULT_CAFES,
    out: DEFAULT_CAFES,
    dryRun: false,
    overwrite: false,
    mapLeft: 0.30,
    mapRight: 0.97,
    mapTop: 0.12,
    mapBottom: 0.89,
    padding: 0.08,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--cafes') args.cafes = argv[++i]
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--overwrite') args.overwrite = true
    else if (arg === '--map-left') args.mapLeft = Number(argv[++i])
    else if (arg === '--map-right') args.mapRight = Number(argv[++i])
    else if (arg === '--map-top') args.mapTop = Number(argv[++i])
    else if (arg === '--map-bottom') args.mapBottom = Number(argv[++i])
    else if (arg === '--padding') args.padding = Number(argv[++i])
    else if (arg === '--help' || arg === '-h') args.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function printHelp() {
  console.log(`
Generate image-relative map pins from POI longitude/latitude.

Usage:
  npm run generate:pins
  npm run generate:pins -- --dry-run
  npm run generate:pins -- --overwrite

Options:
  --cafes <path>       source cafes JSON, default: ${DEFAULT_CAFES}
  --out <path>         output cafes JSON, default overwrites --cafes
  --dry-run            print summary without writing
  --overwrite          replace existing mapCoords; default only fills missing pins
  --map-left <0..1>    left edge of the actual map area inside the image, default 0.30
  --map-right <0..1>   right edge of the actual map area inside the image, default 0.97
  --map-top <0..1>     top edge of the actual map area inside the image, default 0.12
  --map-bottom <0..1>  bottom edge of the actual map area inside the image, default 0.89
  --padding <0..0.4>   geo bounds padding around POIs, default 0.08

The generated pins are starter positions. Use Admin -> Move Pin for final
visual calibration on the static illustrated map.
`)
}

function numberOrNull(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function validateRatio(name, value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a number between 0 and 1`)
  }
}

function boundsFrom(points, padding) {
  const lngs = points.map(point => point.lng)
  const lats = points.map(point => point.lat)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)

  const lngSpan = maxLng - minLng || 0.01
  const latSpan = maxLat - minLat || 0.01
  minLng -= lngSpan * padding
  maxLng += lngSpan * padding
  minLat -= latSpan * padding
  maxLat += latSpan * padding

  return { minLng, maxLng, minLat, maxLat }
}

function project(point, bounds, args) {
  const xRatio = (point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)
  const yRatio = (bounds.maxLat - point.lat) / (bounds.maxLat - bounds.minLat)
  return {
    x: round6(clamp(args.mapLeft + xRatio * (args.mapRight - args.mapLeft), args.mapLeft, args.mapRight)),
    y: round6(clamp(args.mapTop + yRatio * (args.mapBottom - args.mapTop), args.mapTop, args.mapBottom)),
  }
}

function round6(value) {
  return Math.round(value * 1_000_000) / 1_000_000
}

function updateGeoReview(cafe, coords) {
  const issues = (cafe.geoReview?.issues ?? []).filter(issue => issue.code !== 'missing_image_pin')
  return {
    input_name: cafe.geoReview?.input_name ?? cafe.poi?.input_name ?? cafe.name,
    status: issues.length ? 'needs_review' : 'ok',
    in_frame: true,
    city_bounds_ok: cafe.geoReview?.city_bounds_ok ?? Boolean(cafe.poi?.lng_wgs84 != null && cafe.poi?.lat_wgs84 != null && !cafe.poi?.needs_review),
    issues,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }
  for (const [name, value] of [
    ['--map-left', args.mapLeft],
    ['--map-right', args.mapRight],
    ['--map-top', args.mapTop],
    ['--map-bottom', args.mapBottom],
  ]) validateRatio(name, value)
  if (args.mapLeft >= args.mapRight) throw new Error('--map-left must be less than --map-right')
  if (args.mapTop >= args.mapBottom) throw new Error('--map-top must be less than --map-bottom')
  if (!Number.isFinite(args.padding) || args.padding < 0 || args.padding > 0.4) throw new Error('--padding must be between 0 and 0.4')

  const cafesPath = resolve(args.cafes)
  const outPath = resolve(args.out)
  const cafes = JSON.parse(await readFile(cafesPath, 'utf8'))
  if (!Array.isArray(cafes)) throw new Error('cafes JSON must be an array')

  const points = cafes
    .map((cafe, index) => ({
      index,
      lng: numberOrNull(cafe.poi?.lng_wgs84),
      lat: numberOrNull(cafe.poi?.lat_wgs84),
    }))
    .filter(point => point.lng != null && point.lat != null)

  if (!points.length) throw new Error('No cafes have poi.lng_wgs84 and poi.lat_wgs84')

  const bounds = boundsFrom(points, args.padding)
  const summary = []
  const next = cafes.map((cafe, index) => {
    const point = points.find(item => item.index === index)
    if (!point) {
      summary.push({ cafe: cafe.name, status: 'missing_poi_coordinate' })
      return cafe
    }
    if (cafe.mapCoords && !args.overwrite) {
      summary.push({ cafe: cafe.name, status: 'kept_existing_pin', mapCoords: cafe.mapCoords })
      return cafe
    }

    const mapCoords = project(point, bounds, args)
    summary.push({ cafe: cafe.name, status: cafe.mapCoords ? 'overwritten' : 'generated', mapCoords })
    return {
      ...cafe,
      mapCoords,
      pinSource: 'imported',
      geoReview: updateGeoReview(cafe, mapCoords),
    }
  })

  console.log(JSON.stringify({ bounds, summary }, null, 2))
  if (!args.dryRun) {
    await writeFile(outPath, JSON.stringify(next, null, 2) + '\n', 'utf8')
    console.log(`[OK] Wrote ${outPath}`)
  }
}

main().catch(error => {
  console.error(`[ERROR] ${error.message}`)
  process.exit(1)
})
