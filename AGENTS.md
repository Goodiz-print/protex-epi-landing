## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Product catalog data

The `products` content collection (`src/content.config.ts`) is loaded from pre-built, compact JSON files in `src/data/catalog/products.<supplier>.json` (git-tracked — these are the only data files needed to build the site). Raw supplier exports live in `src/data/suppliers/<supplier>/` but are **gitignored**: they're only needed locally to regenerate the catalog data, not to build.

When a supplier sends a new data export:

1. Drop the new file(s) into `src/data/suppliers/<supplier>/` (same filenames as before, or update the paths hardcoded in `scripts/generate-category-mapping[-<supplier>].mjs` / `scripts/generate-catalog-data.mjs` if they changed).
2. Run `node scripts/generate-category-mapping.mjs` (Portwest) or `node scripts/generate-category-mapping-blaklader.mjs` (Blaklader) to update `src/data/category-mapping.<supplier>.json` — review any newly-added `a-trier` entries by hand.
3. Run `pnpm run generate:catalog-data` (or `node scripts/generate-catalog-data.mjs`) to regenerate `src/data/catalog/products.<supplier>.json`.
4. Commit the updated JSON files (mapping + catalog data). Do not commit the raw CSVs.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
