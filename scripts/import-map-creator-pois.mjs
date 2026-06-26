#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULT_CAFES = 'src/data/cafes.json'

function parseArgs(argv) {
  const args = {
    cafes: DEFAULT_CAFES,
    out: DEFAULT_CAFES,
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--poi-json') args.poiJson = argv[++i]
    else if (arg === '--cafes') args.cafes = argv[++i]
    else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help' || arg === '-h') args.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function printHelp() {
  console.log(`
Import map-creator POI results into Cat Cafe Field Guide data.

Usage:
  npm run import:pois -- --poi-json outputs/poi_sets/cat_cafes.json

Options:
  --poi-json <path>   map-creator POISet JSON with a top-level pois[] array
  --cafes <path>      source cafes JSON, default: ${DEFAULT_CAFES}
  --out <path>        output cafes JSON, default overwrites --cafes
  --dry-run           print match summary without writing files

Matching:
  cafe.name/address/neighborhood is matched against poi.input_name,
  poi.resolved_name, poi.address, and candidate names/addresses.
`)
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
}

function poiMatchKeys(poi) {
  const keys = [
    poi.input_name,
    poi.resolved_name,
    poi.address,
    poi.district,
    ...(poi.candidates ?? []).flatMap(candidate => [
      candidate.name,
      candidate.address,
      candidate.formatted_address,
    ]),
  ]
  return new Set(keys.map(normalize).filter(Boolean))
}

function cafeMatchKeys(cafe) {
  return new Set([
    cafe.name,
    cafe.address,
    cafe.neighborhood,
  ].map(normalize).filter(Boolean))
}

function scoreMatch(cafe, poi) {
  const cafeKeys = cafeMatchKeys(cafe)
  const poiKeys = poiMatchKeys(poi)
  let score = 0

  for (const key of cafeKeys) {
    if (poiKeys.has(key)) score += 100
  }

  const cafeName = normalize(cafe.name)
  const poiName = normalize(poi.input_name || poi.resolved_name)
  if (cafeName && poiName) {
    if (cafeName.includes(poiName) || poiName.includes(cafeName)) score += 80
  }

  const cafeAddress = normalize(cafe.address)
  const poiAddress = normalize(poi.address)
  if (cafeAddress && poiAddress) {
    if (cafeAddress.includes(poiAddress) || poiAddress.includes(cafeAddress)) score += 40
  }

  return score
}

function findBestPOI(cafe, pois, usedIndexes) {
  let best = null
  for (let i = 0; i < pois.length; i += 1) {
    if (usedIndexes.has(i)) continue
    const score = scoreMatch(cafe, pois[i])
    if (!best || score > best.score) best = { index: i, poi: pois[i], score }
  }
  return best && best.score > 0 ? best : null
}

function normalizeCandidate(candidate) {
  return {
    poi_id: stringOrEmpty(candidate.poi_id),
    name: stringOrEmpty(candidate.name),
    address: stringOrEmpty(candidate.address ?? candidate.formatted_address),
    province: stringOrEmpty(candidate.province),
    city: stringOrEmpty(candidate.city),
    district: stringOrEmpty(candidate.district),
    type: stringOrEmpty(candidate.type),
    typecode: stringOrEmpty(candidate.typecode),
    lng_gcj02: numberOrNull(candidate.lng_gcj02),
    lat_gcj02: numberOrNull(candidate.lat_gcj02),
    raw: candidate.raw,
  }
}

function normalizePOI(poi) {
  return {
    input_name: stringOrEmpty(poi.input_name),
    resolved_name: nullableString(poi.resolved_name),
    source: stringOrEmpty(poi.source),
    poi_id: nullableString(poi.poi_id),
    address: nullableString(poi.address),
    province: nullableString(poi.province),
    city: nullableString(poi.city),
    district: nullableString(poi.district),
    type: nullableString(poi.type),
    typecode: nullableString(poi.typecode),
    lng_gcj02: numberOrNull(poi.lng_gcj02),
    lat_gcj02: numberOrNull(poi.lat_gcj02),
    lng_wgs84: numberOrNull(poi.lng_wgs84),
    lat_wgs84: numberOrNull(poi.lat_wgs84),
    confidence: Number(poi.confidence ?? 0),
    status: stringOrEmpty(poi.status || 'resolved'),
    needs_review: Boolean(poi.needs_review),
    candidates: Array.isArray(poi.candidates) ? poi.candidates.map(normalizeCandidate) : [],
  }
}

function buildGeoReview(cafe, poi) {
  const issues = []
  const hasCoordinates = poi.lng_wgs84 != null && poi.lat_wgs84 != null

  if (!hasCoordinates) {
    issues.push({
      code: 'missing_coordinate',
      message: 'Missing WGS84 coordinate from map-creator POI resolution.',
    })
  }
  if (!cafe.mapCoords) {
    issues.push({
      code: 'missing_image_pin',
      message: 'Missing image map pin; place this cafe on the front-end map.',
    })
  }
  if (poi.needs_review) {
    issues.push({
      code: 'poi_needs_review',
      message: 'map-creator marked this POI as needing manual review.',
    })
  }
  if (poi.confidence < 0.75) {
    issues.push({
      code: 'low_confidence',
      message: `POI confidence is ${poi.confidence}; verify the resolved place manually.`,
    })
  }

  return {
    input_name: poi.input_name || cafe.name,
    status: issues.length ? 'needs_review' : 'ok',
    in_frame: Boolean(cafe.mapCoords),
    city_bounds_ok: hasCoordinates && !poi.needs_review,
    issues,
  }
}

function pinSourceFor(cafe, poi, review) {
  if (review.status !== 'ok') return 'needs_review'
  if (poi.lng_wgs84 != null && poi.lat_wgs84 != null) return 'imported'
  return cafe.mapCoords ? 'manual' : 'needs_review'
}

function stringOrEmpty(value) {
  return String(value ?? '')
}

function nullableString(value) {
  return value == null || value === '' ? null : String(value)
}

function numberOrNull(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.poiJson) {
    printHelp()
    process.exit(args.help ? 0 : 1)
  }

  const poiPath = resolve(args.poiJson)
  const cafesPath = resolve(args.cafes)
  const outPath = resolve(args.out)
  const poiSet = JSON.parse(await readFile(poiPath, 'utf8'))
  const cafes = JSON.parse(await readFile(cafesPath, 'utf8'))

  if (!Array.isArray(poiSet.pois)) throw new Error('POI JSON must contain top-level pois[]')
  if (!Array.isArray(cafes)) throw new Error('cafes JSON must be an array')

  const pois = poiSet.pois.map(normalizePOI)
  const usedIndexes = new Set()
  const summary = []

  const next = cafes.map(cafe => {
    const match = findBestPOI(cafe, pois, usedIndexes)
    if (!match) {
      summary.push({ cafe: cafe.name, status: 'unmatched' })
      return cafe
    }
    usedIndexes.add(match.index)
    const review = buildGeoReview(cafe, match.poi)
    summary.push({
      cafe: cafe.name,
      status: 'matched',
      poi: match.poi.input_name || match.poi.resolved_name,
      score: match.score,
      review: review.status,
    })
    return {
      ...cafe,
      coordinatePolicy: poiSet.coordinate_policy || 'map-creator POI coordinates imported; image pin remains manually reviewable.',
      pinSource: pinSourceFor(cafe, match.poi, review),
      poi: match.poi,
      geoReview: review,
    }
  })

  const unmatchedPois = pois
    .map((poi, index) => ({ poi, index }))
    .filter(({ index }) => !usedIndexes.has(index))
    .map(({ poi }) => poi.input_name || poi.resolved_name || '(unnamed)')

  console.log(JSON.stringify({ summary, unmatchedPois }, null, 2))
  if (!args.dryRun) {
    await writeFile(outPath, JSON.stringify(next, null, 2) + '\n', 'utf8')
    console.log(`[OK] Wrote ${outPath}`)
  }
}

main().catch(error => {
  console.error(`[ERROR] ${error.message}`)
  process.exit(1)
})
