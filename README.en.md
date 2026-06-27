<div align="center">
  <img src="public/Cover.png" alt="Cat Cafe Field Guide vintage cover" width="760" />

  <h1>Cat Cafe Field Guide</h1>
  <p><strong>Cat cafe map · Cafe profiles · Resident cat field notes</strong></p>

  <p><a href="README.md">中文</a> · <strong>English</strong></p>

  <p>
    <img src="https://img.shields.io/badge/version-v0.1.0-8B4513" alt="version v0.1.0" />
    <img src="https://img.shields.io/badge/status-MVP-2F6F68" alt="status MVP" />
    <img src="https://img.shields.io/badge/build-static-C46B3C" alt="static build" />
    <img src="https://img.shields.io/badge/map-GIS%20%2B%20GPT-697A45" alt="GIS and GPT map" />
    <img src="https://img.shields.io/badge/license-MIT-555555" alt="MIT license" />
  </p>
</div>

Cat Cafe Field Guide is a static check-in map that turns city cat cafes, resident cats, and personal notes into a vintage paper field guide.

For the best experience, browse the public read-only guide first; maintainers can then run the project locally and open `/?admin=true` to edit cafes, cats, photos, and map pins.

```text
Map -> Cat Cafe -> Cats
```

## Product

This is a personal cat cafe notebook designed for continued local maintenance.

- Vite + React + TypeScript + Tailwind
- Static publishing with no database or login
- Dev-only admin panel
- JSON-based cafe and cat content
- Photos stored in `public/photos/`
- Vintage paper field-guide visual language

## Quick Start

```bash
npm install
npm run dev
```

Browse `http://localhost:5173/` or open `http://localhost:5173/?admin=true` for local editing.

Edits write to:

```text
src/data/cafes.json
public/photos/*.jpg
```

## URL Modes

| URL | Purpose |
| --- | --- |
| `/` | Public read-only guide |
| `/?demo=true` | Layout and card preview |
| `/?backdrop=cream` | Switch between `dark`, `desk`, and `cream` backdrops |
| `/?admin=true` | Local content editor under `npm run dev` |

## How It Works

```text
Maintainer (local admin)             Visitors (deployed site)
────────────────────────             ────────────────────────
npm run dev                          Read-only browsing
Open ?admin=true                     No login or database
Edit cafes / cats / photos / pins    Displays committed content
↓
Write cafes.json and public/photos
↓
git commit + push
↓
Vercel redeploys
```

## GIS + GPT Map Workflow

Maps are produced offline before publishing. The frontend does not call a realtime map API.

```text
Place names
↓
npm run create:cafes
↓
map-creator resolves POI / GIS coordinates
↓
npm run import:pois
↓
npm run generate:pins
↓
GPT Image styles the map poster
↓
public/map_north.png
public/map_south.png
public/Cover.png
↓
Admin mode provides final pin calibration
```

![Cat Cafe GIS and GPT styled map](public/map_north.png)

```bash
npm run create:cafes -- --city "San Diego" --places "The Cat Cafe" "Whiskers & Wine Bar" "The Cat Lounge"
npm run import:pois -- --poi-json /path/to/map-creator-pois.json
npm run generate:pins -- --dry-run
npm run generate:pins
npm run build
```

See [GPT Image map poster guidance](docs/GPT_IMAGE_POSTER.md) and the full [POI and pin pipeline](docs/MAP_PIPELINE.md).

## Project Structure

```text
src/
├── components/          # Book, cover, cards, admin, and demo views
├── data/                # JSON content, types, config, and storage
└── styles/              # Global field-guide styles
```

## Deploy

Import the repository into [Vercel](https://vercel.com/new). No database, auth provider, or environment variables are required.

## Scope

The current version does not include a database, login, hosted backend, multi-user comments, realtime map API, complex permissions, online editing, or admin map-image uploads.

## Inspiration

This project was inspired by the teacher-provided course project [field-guide-map](https://github.com/mengxuebi-mush/field-guide-map.git), including its paper field-guide reading experience, static publishing approach, and restrained editing workflow.

I extended that foundation into a `Map -> Cat Cafe -> Cats` hierarchy and added separate cafe and cat notes, photo maintenance, POI coordinates, geographic review states, GIS import, assisted pin generation, and a GPT Image poster workflow. Thanks to the course project for the design and engineering inspiration.

## Docs

- [PRD](docs/PRD.md)
- [Step-by-step spec](docs/SPEC.md)
- [map-creator POI import pipeline](docs/MAP_PIPELINE.md)
- [GPT Image map poster prompts](docs/GPT_IMAGE_POSTER.md)

## Tech

Vite · React · TypeScript · Tailwind · Vercel

## License

MIT. See [LICENSE](LICENSE).
