# Cat Cafe Field Guide PRD

## Product Positioning

Cat Cafe Field Guide is a personal city guide for cat cafe check-ins. It lets the maintainer place cat cafes on a static map, write notes for each cafe, and keep a small profile for each resident cat.

It is not a review platform, social community, or full map product. It is a static editorial field guide.

## Core Hierarchy

```text
Static cat cafe map
-> Cat cafe
-> Resident cats
```

## Target Users

- Cat cafe lovers planning weekend visits
- People who want a personal record of visited cafes and cats
- Students or beginners building a product/design/front-end portfolio piece
- Friends looking for cozy hangout ideas

## Core Scenarios

1. Browse the map to see where cat cafes are located.
2. Open a cat cafe card to understand the cafe experience.
3. Browse the resident cats under each cafe.
4. Locally maintain cafe notes, cat notes, ratings, and photos.

## MVP Requirements

- Show a cover page.
- Show a static map with numbered cat cafe pins.
- Show cat cafe cards.
- Show resident cat cards under each cafe.
- Support dev-only admin editing.
- Save data to `src/data/cafes.json`.
- Save uploaded photos to `public/photos/`.
- Build as a static Vite site.

## Non-Goals

- No database
- No login
- No real backend
- No multi-user comments
- No realtime map API
- No complex permissions
- No online editing
- No map upload in admin mode

## Success Criteria

- The final site uses a vintage paper field-guide visual language.
- The core product hierarchy is `Map -> Cat Cafe -> Cats`.
- `npm run build` succeeds.
- `/?admin=true` works locally and updates JSON/photos.
