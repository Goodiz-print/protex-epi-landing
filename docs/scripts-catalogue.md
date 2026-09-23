# Scripts du catalogue produits

Le site ne lit **jamais** les exports fournisseurs au build. Tout passe par des scripts
lancés à la main, qui produisent des fichiers JSON committés dans `src/data/`. Ce document
décrit chaque script, ses entrées/sorties et les procédures courantes.

## Vue d'ensemble

```
src/data/suppliers/<fournisseur>/*.csv      exports bruts (gitignorés, machines locales)
        │
        ├─ generate-category-mapping*.mjs ─▶ src/data/category-mapping.<f>.json   (committé)
        │                                            ▲
        │                                   reclassify-catalog.mjs ◀─ category-overrides.<f>.json
        ▼
generate-catalog-data.mjs ───────────────▶ src/data/catalog/products.<f>.json    (committé)
        ▲                                            ▲
        │                            apply-image-overrides.mjs ◀─ image-overrides.<f>.json
        │                            check-product-images.mjs  ─▶ known-bad-images.portwest.json
        │                                                       ─▶ scripts/reports/broken-product-images.json
        ▼
src/content/loaders/json-products-loader.ts   lu par astro dev / astro build
```

### Fichiers de données

| Fichier | Rôle | Versionné ? |
| --- | --- | --- |
| `src/data/suppliers/<fournisseur>/…` | Exports bruts (Portwest CSV, Mascot extended + slim, Blaklader FAB-DIS). Voir `src/data/suppliers/mascot/README.md` pour Mascot. | ❌ (`*.csv` gitignorés) |
| `src/data/category-mapping.<f>.json` | Catégorie / sous-catégorie par code style. **Source de vérité** pour la régénération. | ✅ |
| `src/data/category-overrides.<f>.json` | Corrections manuelles de catégorie (clé = code style). | ✅ |
| `src/data/catalog/products.<f>.json` | Catalogue pré-calculé, un produit (= un coloris) par ligne. **Ce que le site lit.** | ✅ |
| `src/data/image-overrides.<f>.json` | Corrections manuelles d'image (clé = `id` du produit, valeur = URL). | ✅ |
| `src/data/known-bad-images.portwest.json` | URL du CDN Portwest confirmées mortes. | ✅ |
| `scripts/reports/broken-product-images.json` | Rapport : produits encore sans photo valide. | ✅ |

Fournisseurs : `portwest`, `mascot`, `blaklader`.

## Les scripts

Tous se lancent depuis la racine du projet avec `node scripts/<nom>.mjs` (ou l'alias
`pnpm run …` indiqué). Aucun n'est exécuté par `astro dev` / `astro build`.

| Script | Ce qu'il fait | Entrées | Sorties | Exports nécessaires ? |
| --- | --- | --- | --- | --- |
| `prepare-mascot-csv.mjs` | Distille l'export Mascot « extended » (291 Mo) en CSV allégé et y joint prix 2026 + nom commercial (par EAN). | `MASCOT_extended_productdata_FR.csv`, `Produits-Table 1.csv` | `src/data/suppliers/mascot/mascot-products.slim.csv` | Oui (Mascot) |
| `generate-category-mapping.mjs` | Propose une catégorie aux références Portwest **nouvelles** (mots-clés). Additif : ne réécrit jamais une entrée existante, sauf celles en `a-trier`. | export Portwest | `category-mapping.portwest.json` | Oui (Portwest) |
| `generate-category-mapping-blaklader.mjs` | Idem pour Blaklader. | FAB-DIS B01_COMMERCE | `category-mapping.blaklader.json` | Oui (Blaklader) |
| `generate-category-mapping-mascot.mjs` | Idem pour Mascot (après `prepare-mascot-csv.mjs`). | slim CSV Mascot | `category-mapping.mascot.json` | Oui (Mascot) |
| `generate-catalog-data.mjs [--supplier a,b]` — `pnpm run generate:catalog` | Reconstruit le catalogue JSON à partir des exports + mapping. Un fournisseur dont l'export manque est **ignoré** (son JSON committé est conservé). Réapplique `known-bad-images` (image de repli) et `image-overrides`. | exports + mapping + known-bad + image-overrides | `src/data/catalog/products.<f>.json` | Oui, pour les fournisseurs traités |
| `reclassify-catalog.mjs` — `pnpm run reclassify:catalog` | Fusionne `category-overrides.<f>.json` dans le mapping **et** patche le catalogue JSON. Idempotent. | category-overrides | mapping + catalogue | Non |
| `apply-image-overrides.mjs` — `pnpm run apply:image-overrides` | Patche le catalogue JSON avec `image-overrides.<f>.json`. Idempotent. | image-overrides | catalogue | Non |
| `check-product-images.mjs` — `pnpm run check:images` | Vérifie en HTTP chaque URL d'image, patche le catalogue, met à jour la liste known-bad et le rapport (détail ci-dessous). | catalogue (+ exports s'ils sont là) | catalogue, image-overrides, known-bad, rapport | Non |

Bibliothèques (non exécutables) : `scripts/lib/supplier-csv.ts` (parsing / groupage / jointure
des exports, utilisé uniquement par `generate-catalog-data.mjs`) et
`scripts/lib/image-overrides.mjs` (lecture / application des overrides d'image).

## Procédures

### 1. Nouvel export fournisseur

```bash
# 1. Déposer les fichiers bruts dans src/data/suppliers/<fournisseur>/
# 2. Mascot uniquement : produire le CSV allégé
node scripts/prepare-mascot-csv.mjs
# 3. Classer les nouvelles références (additif), puis relire les `a-trier` à la main
node scripts/generate-category-mapping.mjs            # Portwest
node scripts/generate-category-mapping-blaklader.mjs
node scripts/generate-category-mapping-mascot.mjs
# 4. Régénérer le catalogue (tous les fournisseurs dont l'export est présent, ou un seul)
pnpm run generate:catalog
pnpm run generate:catalog -- --supplier portwest
# 5. Committer src/data/catalog/*.json et src/data/category-mapping.*.json
```

Les corrections manuelles survivent à la régénération : les overrides de catégorie sont déjà
fusionnés dans le mapping, les overrides d'image sont réappliqués par le script.

### 2. Reclasser des produits sans les exports

1. Ajouter les codes style dans `src/data/category-overrides.<fournisseur>.json` :

   ```json
   { "PS59": { "category": "tete", "subcategory": "protection-tete", "name": "Casquette anti-heurt AirTech" } }
   ```

   (`name` est un simple commentaire ; seuls `category` et `subcategory` sont lus.)

2. `pnpm run reclassify:catalog`
3. Committer overrides + mapping + catalogue ensemble.

⚠️ L'URL d'un produit contient sa catégorie : un produit déplacé change d'URL.

### 3. Vérifier et réparer les images

```bash
pnpm run check:images                              # tout, écrit les fichiers
pnpm run check:images -- --supplier portwest       # un fournisseur
pnpm run check:images -- --dry-run                 # rapport sur stdout, n'écrit rien
pnpm run check:images -- --source catalog          # ignorer les exports même présents
pnpm run check:images -- --concurrency 48          # requêtes parallèles (défaut 24)
```

Une requête HTTP par URL distincte (~25 000) : compter plusieurs minutes.

**D'où viennent les URL testées (candidats), par produit et dans cet ordre :**

1. l'URL actuelle du produit dans le catalogue ;
2. si l'export du fournisseur est présent dans `src/data/suppliers/` (ou `--source csv`) :
   toutes les images que l'export liste pour ce style + coloris (tailles alternatives) ;
3. des URL **dérivées** du nommage du fournisseur, qui permettent de retrouver la photo d'un
   produit aujourd'hui en placeholder :
   - Portwest : `https://d11ak7fd9ypfb7.cloudfront.net/styles1100px/<style><couleur>.jpg`,
     où `<couleur>` = les 3 caractères qui suivent le code style dans les SKU
     (`FT45BKR37` → `FT45BKR`). Règle vérifiée sur 100 % des URL du catalogue.
   - Mascot : `https://pimage.mascot.fr/<produit-qualité-coloris>_P01_1000pxweb.jpg`
     (et la variante `_P_`).

**Ce que le script écrit** (sauf `--dry-run`) :

| Fichier | Mise à jour |
| --- | --- |
| `src/data/catalog/products.<f>.json` | Chaque produit garde son URL si elle répond ; sinon prend le 1ᵉʳ candidat vivant ; sinon le placeholder `/images/product-placeholder.svg`. |
| `src/data/image-overrides.<f>.json` | Une photo retrouvée via une URL **dérivée** y est enregistrée, pour survivre à une régénération. |
| `src/data/known-bad-images.portwest.json` | Fusion : les URL Portwest confirmées mortes sont ajoutées, celles redevenues vivantes retirées. |
| `scripts/reports/broken-product-images.json` | Résumé du run + liste des produits encore sans photo (id, nom, prix, URL testées et statuts). |

**Règles de sûreté :**

- Un lien est « mort » uniquement sur réponse HTTP 4xx (hors 429). Une erreur réseau, un
  timeout, un 429 ou un 5xx sont « indéterminés » : l'URL est laissée telle quelle.
- Si plus de 20 % des URL sont indéterminées, le run est considéré hors-ligne et **rien
  n'est écrit**.
- Le script est idempotent : le relancer sans changement ne modifie rien.
- Committer ensemble catalogue, overrides, known-bad et rapport.

### 4. Corriger une image à la main

Relever l'URL d'une photo valide (ex. sur portwest.com), l'ajouter dans
`src/data/image-overrides.<fournisseur>.json` avec pour clé l'`id` du produit tel qu'il
apparaît dans le catalogue JSON :

```json
{ "portwest:FT45:noir": "https://d11ak7fd9ypfb7.cloudfront.net/styles1100px/FT45BKR.jpg" }
```

puis `pnpm run apply:image-overrides` et committer les deux fichiers.

### 5. Ce que le site fait d'un produit sans photo

Logique dans `src/utils/product-image.ts` :

- **Sans photo ni prix** : fiche fournisseur incomplète (référence pas encore vendue en
  France). Le loader ne la publie pas : pas de page produit, pas de carte, pas d'entrée de
  recherche. Elle réapparaît dès qu'un override ou un nouvel export lui donne une photo ou
  un prix.
- **Sans photo mais avec prix** : publiée, mais reléguée en fin de tous les listings (tri
  stable).
- **Modèle dont le premier coloris n'a pas de photo** : la carte prend l'image d'un autre
  coloris.

## Référence

- Consignes pour les agents : `AGENTS.md` (sections « Catalog data » et « Product images »).
- Structure des données Mascot : `src/data/suppliers/mascot/README.md`.
