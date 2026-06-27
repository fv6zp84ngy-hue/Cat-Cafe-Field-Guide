# Cat Cafe Field Guide Step-by-Step Spec

## Step 0: Keep the Static System

Keep:

```text
Vite + React + TypeScript + Tailwind
localStorage
JSON data files
public/photos
dev-only admin mode
Vercel static deploy
```

Do not add:

```text
database
login
real backend
map API
multi-user comments
complex permissions
```

## Step 1: Data Types

Use `CatCafe` and `CatProfile`.

```ts
export interface CatCafe {
  id: string
  name: string
  address: string
  neighborhood: string
  mapNumber: number
  region?: 'north' | 'south'
  mapCoords?: { x: number; y: number }
  photos: string[]
  review: string
  ratings: {
    comfort: number
    catFriendliness: number
    photoFriendly: number
  }
  reservationNote?: string
  priceNote?: string
  cats: CatProfile[]
}

export interface CatProfile {
  id: string
  name: string
  photos: string[]
  tags: string[]
  review: string
  ratings: {
    friendly: number
    active: number
    photogenic: number
  }
}
```

## Step 2: Data Files

Use:

```text
src/data/cafes.json
src/data/cafes.ts
src/data/storage.ts
```

`cafes.json` is the committed source of truth.

## Step 3: Dev-Only Save API

Keep `/api/save-photo`.

Use `/api/save-cafes` to write `src/data/cafes.json`.

Do not add `/api/save-map`.

## Step 4: Front-End Pages

Desktop:

```text
Cover
-> Cafe notes
-> North map
-> South map
-> Colophon
```

Mobile:

```text
Cover
-> Cafe notes
-> Map section
```

## Step 5: Cards

Cat cafe cards show:

```text
map number
cafe name
neighborhood/address
first cafe photo
Comfort / Cats / Photo ratings
short review
cat count
resident cat cards
```

Cat cards show:

```text
cat photo
cat name
tags
Friendly / Active / Photo ratings
short review
```

## Step 6: Admin

Use a single modal pattern.

Cafe editor:

```text
photos
name
address
neighborhood
review
reservation note
price note
ratings
map number
region
place/move/clear pin
```

Cat editor inside the same modal:

```text
add cat
delete cat
photo
name
tags
review
ratings
```

## Step 7: Verification

Run:

```bash
npm run build
```

Manual checks:

```text
/
/?demo=true
/?admin=true
```
