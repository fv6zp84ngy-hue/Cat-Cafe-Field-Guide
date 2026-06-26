#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULT_OUT = 'src/data/cafes.json'

function parseArgs(argv) {
  const args = {
    city: '',
    out: DEFAULT_OUT,
    startNumber: 1,
    dryRun: false,
    places: [],
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--city') args.city = argv[++i]
    else if (arg === '--places-file') args.placesFile = argv[++i]
    else if (arg === '--places') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.places.push(argv[++i])
    } else if (arg === '--out') args.out = argv[++i]
    else if (arg === '--start-number') args.startNumber = Number(argv[++i])
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--help' || arg === '-h') args.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function printHelp() {
  console.log(`
Create initial Cat Cafe Field Guide data from a place-name list.

Usage:
  npm run create:cafes -- --city "San Diego" --places-file places.txt
  npm run create:cafes -- --city "San Diego" --places "The Cat Cafe" "Whiskers & Wine Bar"

Options:
  --city <name>          city or area name used as fallback neighborhood
  --places-file <path>   text file, one place per line; lines starting with # are ignored
  --places <names...>    place names passed directly on the command line
  --out <path>           output JSON, default: ${DEFAULT_OUT}
  --start-number <n>     first map number, default: 1
  --dry-run              print JSON without writing

This creates starter cafes with needs_review geo status. Run import:pois later
to attach map-creator POI coordinates.
`)
}

async function readPlaces(args) {
  const fromFile = args.placesFile
    ? (await readFile(resolve(args.placesFile), 'utf8'))
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
    : []
  return [...fromFile, ...args.places]
    .map(place => place.trim())
    .filter(Boolean)
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
}

function starterCafe(name, index, args) {
  const mapNumber = args.startNumber + index
  const city = args.city || 'Unresolved area'
  return {
    id: slug(name) || `cat-cafe-${mapNumber}`,
    name,
    address: '',
    neighborhood: city,
    mapNumber,
    region: 'north',
    coordinatePolicy: 'Manual place-name seed; map pin and map-creator POI coordinates not resolved yet.',
    pinSource: 'needs_review',
    poi: {
      input_name: name,
      resolved_name: null,
      source: 'place_name_seed',
      poi_id: null,
      address: null,
      province: null,
      city: args.city || null,
      district: null,
      type: 'cat cafe',
      typecode: null,
      lng_gcj02: null,
      lat_gcj02: null,
      lng_wgs84: null,
      lat_wgs84: null,
      confidence: 0,
      status: 'place_name_only',
      needs_review: true,
      candidates: [],
    },
    geoReview: {
      input_name: name,
      status: 'needs_review',
      in_frame: false,
      city_bounds_ok: false,
      issues: [
        {
          code: 'missing_coordinate',
          message: 'Missing WGS84 coordinate from map-creator POI resolution.',
        },
        {
          code: 'missing_image_pin',
          message: 'Missing image map pin; place this cafe on the front-end map.',
        },
      ],
    },
    photos: [],
    review: 'Starter cafe note. Replace this with your visit impression, atmosphere, and check-in value.',
    ratings: {
      comfort: 3,
      catFriendliness: 3,
      photoFriendly: 3,
    },
    reservationNote: 'Not checked yet.',
    priceNote: 'Not checked yet.',
    environmentNote: 'Starter environment note. Replace after review.',
    photoNote: 'Starter photo/check-in note. Replace after review.',
    visitTips: 'Needs manual review before publishing.',
    cats: [
      {
        id: `${slug(name) || `cat-cafe-${mapNumber}`}-cat-1`,
        name: 'Resident Cat',
        photos: [],
        tags: ['needs profile'],
        review: 'Starter cat profile. Replace with a real resident cat note.',
        ratings: {
          friendly: 3,
          active: 3,
          photogenic: 3,
        },
      },
    ],
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }
  if (!Number.isFinite(args.startNumber) || args.startNumber < 1) {
    throw new Error('--start-number must be a positive number')
  }
  const places = await readPlaces(args)
  if (!places.length) throw new Error('Provide --places-file or --places')

  const cafes = places.map((place, index) => starterCafe(place, index, args))
  const output = JSON.stringify(cafes, null, 2) + '\n'
  if (args.dryRun) {
    console.log(output)
    return
  }
  const outPath = resolve(args.out)
  await writeFile(outPath, output, 'utf8')
  console.log(`[OK] Wrote ${cafes.length} starter cafes to ${outPath}`)
}

main().catch(error => {
  console.error(`[ERROR] ${error.message}`)
  process.exit(1)
})
