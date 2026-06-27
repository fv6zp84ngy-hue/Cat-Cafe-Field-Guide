# GPT Image Map Poster Styling

This project stays static. GPT Image is used only as an offline production step to style map assets before placing them in `public/`.

## Goal

Turn a GIS map draft or an already approved map into a polished vintage cat cafe field-guide poster that matches the app's rendered state.

Final files:

```text
public/map_north.png
public/map_south.png
public/Cover.png
```

Do not commit API keys, prompts containing private data, temporary uploads, or raw tool caches.

## Reference-First Prompt

Use the approved `public/map_north.png` as the style lock. Upload it as the visual reference whenever generating `map_south.png` or `Cover.png`.

```text
Use the uploaded reference image as the exact rendered style target.

Create a matching vintage cat cafe field-guide map poster. The new image must look like it belongs to the exact same printed guidebook series as the reference.

Canvas:
Landscape 4:3 ratio.
No app UI, no browser frame, no phone frame.

Style:
Warm aged paper, ornate printed border, sepia ink, copperplate hand-drawn illustration, muted terracotta badges, faded teal-blue water, sage green parks, thin brown street lines, cozy editorial guidebook feeling.

Composition:
Keep the same structure as the reference:
left vertical legend panel,
right illustrated city map,
numbered circular location markers,
small cat cafe illustrations,
paw divider ornaments,
subtle paper texture.

Text must be readable and sparse.
Do not redesign the visual system. Match the rendered state closely.

Avoid:
Google Maps style, satellite imagery, modern app UI, glossy gradients, neon colors, 3D effects, childish cartoon stickers, fake logos, cluttered text, illegible tiny labels, different paper color, different border style.
```

## North Map Regeneration Prompt

Use only if `map_north.png` needs to be regenerated.

```text
Use the uploaded reference image as the exact rendered style target.

Create a vintage field-guide city map page for:
Cat Map
San Diego field guide

Keep a left legend panel listing:
01 The Cat Cafe
02 Whiskers & Wine Bar
03 The Cat Lounge

Place the same numbered markers on the illustrated map area.
Maintain the same antique paper texture, sepia linework, muted teal water, sage parks, ornate border, serif title, cat illustrations, and printed guidebook feel.
```

## South Map Prompt

```text
Use the uploaded north map reference as the exact rendered style target.

Create a matching SOUTH AREA map page for the same Cat Cafe Field Guide series.

Canvas:
Landscape 4:3 ratio.
Same left legend panel, right map area, ornate border, paper texture, typography mood, marker style, and cat illustration style as the reference.

Title:
Cat Map

Subtitle:
San Diego south field guide

Legend entries:
04 Harbor Cat Cafe
05 Purr & Pour
06 Sunset Cat Room

Right map area:
Show a southern coastal or harbor city area with water, streets, parks, coastline, neighborhood blocks, and roads.
Place clear numbered markers 04, 05, 06 on the map.
Use sparse readable labels such as Harbor District, South Park, Marina Walk, Sunset Pier.

Match the reference exactly in color palette, line weight, badge style, paper grain, border treatment, and printed antique guidebook feeling.
```

## Cover Prompt

```text
Use the uploaded Cat Map reference as the exact rendered style target.

Create a matching vintage cover page for the same Cat Cafe Field Guide.

Canvas:
Landscape 4:3 ratio.
Full cover illustration, no app UI, no browser frame.

Main title:
Cat Cafe Field Guide

Subtitle:
San Diego check-in map

Composition:
Centered vintage guidebook cover.
Large elegant serif title.
Small subtitle underneath.
Decorative paw divider ornaments.
Hand-drawn cat resting above or beside the title.
Small illustrated cat cafe storefront near the lower area.
Subtle map-line patterns, tiny street fragments, compass marks, coffee cup, plants, and cat-themed field guide details in the background.

Match the reference image's warm aged paper, ornate border, sepia ink, muted terracotta, faded teal-blue, sage green, and copperplate field-guide illustration style.
```

## Output Requirements

```text
Format: PNG
Aspect ratio: 4:3
Minimum size: 2400 x 1800
Preferred size: 3200 x 2400 or higher
```

After export:

```text
public/map_north.png
public/map_south.png
public/Cover.png
```

Keep filenames unchanged so the frontend can load them without code changes.

## QA Checklist

- The image matches the approved `map_north.png` rendered state.
- Text is readable at web preview size.
- No modern map controls, app chrome, search bars, or fake logos.
- No major style drift in border, paper color, marker style, or cat illustration style.
- Main map area has enough open space for clickable frontend pins.
- The output is 4:3 and does not require frontend CSS changes.
- Run `npm run build` after replacing assets.
