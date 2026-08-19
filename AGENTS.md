## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Catalog data

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

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
