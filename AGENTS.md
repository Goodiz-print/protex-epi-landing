## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Catalog data

Detailed, step-by-step documentation of every catalog script (inputs, outputs, procedures)
lives in `docs/scripts-catalogue.md`. npm aliases: `pnpm run generate:catalog`,
`pnpm run reclassify:catalog`, `pnpm run apply:image-overrides`, `pnpm run check:images`.

The product catalog is **not** built from the supplier CSVs at build time. The raw
exports live in `src/data/suppliers/` and are **gitignored**; what is committed and
what `astro dev`/`astro build` actually read is the pre-computed
`src/data/catalog/products.<supplier>.json` (loaded by
`src/content/loaders/json-products-loader.ts`).

The raw exports are kept **on local machines only** — there is no shared storage for
them. Regenerating the catalog therefore requires having the supplier's latest export
at hand; a checkout without them still builds the site normally.

When a supplier ships a new export:

1. Drop the raw CSVs into `src/data/suppliers/<supplier>/`.
2. **Mascot only** — distill the 291 MB extended export into the slim CSV:
   `node scripts/prepare-mascot-csv.mjs`
3. Classify any new references (additive, never rewrites existing entries):
   `node scripts/generate-category-mapping.mjs` (Portwest),
   `node scripts/generate-category-mapping-blaklader.mjs`,
   `node scripts/generate-category-mapping-mascot.mjs`
   Then review the `a-trier` entries by hand in `src/data/category-mapping.<supplier>.json`.
4. Regenerate the catalog: `node scripts/generate-catalog-data.mjs`
5. Commit the changed `src/data/catalog/*.json` and `src/data/category-mapping.*.json`.

The CSV parsing / grouping / joining logic lives in `scripts/lib/supplier-csv.ts` and is
used **only** by step 4 — never at build time.

### Reclassifying products without the CSVs

Manual category fixes go in `src/data/category-overrides.<supplier>.json` (keyed by style
code). Run `node scripts/reclassify-catalog.mjs`: it merges the overrides into
`src/data/category-mapping.<supplier>.json` (so the next regeneration keeps them) **and**
patches `src/data/catalog/products.<supplier>.json` in place, so no supplier export is
needed. Commit the overrides, the mapping and the catalog JSON together. Product URLs
embed the category, so a moved product changes URL.

## Product images

Product images are read from each supplier's CDN URL (Portwest, Blaklader, Mascot) —
dead links appear over time as those CDNs drift. Run `pnpm run check:images` periodically
(one live HTTP request per distinct image URL, several minutes). It works with or without
the supplier exports:

- with an export in `src/data/suppliers/<supplier>/`, every image the export lists for a
  style+colour is a candidate (alternate sizes included);
- without it, the candidates are the URL each product currently uses in
  `src/data/catalog/products.<supplier>.json`, plus URLs derived from the supplier's naming
  scheme (Portwest `styles1100px/<style><colour>.jpg` from the SKUs, Mascot
  `<produit-qualité-coloris>_P01_1000pxweb.jpg`), which can bring a placeholder product back.

It then patches the committed catalog JSON in place (dead URL → first alive candidate →
placeholder), records a photo recovered through a derived URL in
`src/data/image-overrides.<supplier>.json`, merges the confirmed-dead Portwest URLs into
`src/data/known-bad-images.portwest.json` (used by `generate-catalog-data.mjs` to pick an
alternate from the export) and writes `scripts/reports/broken-product-images.json` (every
product still rendering `/images/product-placeholder.svg`). Commit those files together.
Transport errors are never treated as dead links; a run with too many of them writes nothing.
Options: `--supplier portwest,mascot`, `--source csv|catalog`, `--dry-run`, `--concurrency N`.

`node scripts/generate-catalog-data.mjs [--supplier …]` rebuilds the catalog JSON from the
exports; a supplier whose export is missing is skipped and keeps its committed JSON. Category
overrides (merged into the mapping) and image overrides are re-applied on every run.

### Fixing a product image without the CSVs

Put the valid URL in `src/data/image-overrides.<supplier>.json`, keyed by the product `id`
from the catalog JSON (e.g. `"portwest:FT45:noir": "https://…/FT45BKR.jpg"`), then run
`node scripts/apply-image-overrides.mjs` and commit both files. `generate-catalog-data.mjs`
re-applies the overrides on every regeneration, so they survive a new supplier export.

### Products without image

A product whose `imageUrl` is the placeholder **and** whose price is 0 is treated as an
unfinished supplier row (not yet sold on the FR market): the loader skips it, so it has no
product page, no listing card and no search entry (see `src/utils/product-image.ts`). It
comes back automatically once an image override or a new export gives it a photo or a price.
Products that only lack the photo stay published but are sorted last in every listing, and a
model whose first colourway has no photo takes its card image from another colourway.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
