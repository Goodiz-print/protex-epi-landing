# Protex EPI — site vitrine et catalogue

Site de Protex EPI (Goodiz Print) : catalogue d'équipements de protection individuelle
(Portwest, Mascot, Blaklader — environ 9 000 fiches), personnalisation, offre collectivités et
formulaire de devis. Bilingue français / anglais.

- **Astro 7** en génération statique, **Tailwind CSS 4**, i18n Astro (`fr` par défaut, `/en/…`).
- Recherche du catalogue : **Pagefind** (index construit après `astro build`).
- Hébergement **Netlify** : site statique + fonction `netlify/functions/quote.mts` (envoi des
  devis par e-mail via Resend).

## Prérequis

- Node.js **≥ 22.12** (Netlify et la CI utilisent Node 22).
- **pnpm 11** — la version exacte est fixée par `packageManager` dans `package.json`
  (`corepack enable` l'installe automatiquement).

## Démarrer

```sh
pnpm install
pnpm dev            # http://localhost:4321 (ou `astro dev --background`)
pnpm build          # site statique dans dist/ + index Pagefind (~18 000 pages)
pnpm preview        # sert dist/ en local
```

Le formulaire de devis passe par une fonction Netlify : pour le tester en local, déclarer les
variables dans `.env` puis lancer `npx netlify dev`.

## Commandes

| Commande                         | Rôle                                                                  |
| :------------------------------- | :-------------------------------------------------------------------- |
| `pnpm astro check`               | Vérification des types (TypeScript + composants Astro)                |
| `pnpm test`                      | Tests (`node --test`, fichiers dans `tests/`)                         |
| `pnpm format` / `format:check`   | Formatage Prettier (écrit / vérifie seulement)                        |
| `pnpm run generate:catalog`      | Régénère le catalogue depuis les exports fournisseurs                 |
| `pnpm run reclassify:catalog`    | Applique les corrections de catégories                                |
| `pnpm run complete:catalog`      | Nomme les produits sans libellé, applique les corrections de fiches   |
| `pnpm run apply:image-overrides` | Applique les corrections d'images                                     |
| `pnpm run check:images`          | Vérifie les photos produits sur les CDN fournisseurs (plusieurs min.) |

Le détail de chaque script catalogue (entrées, sorties, procédures pas à pas) est dans
[`docs/scripts-catalogue.md`](docs/scripts-catalogue.md) ; les images du site dans
[`docs/images.md`](docs/images.md).

## Organisation

```text
src/
  pages/              routes FR (produits/, collectivites/, devis…) et EN (en/products/…)
  components/         composants Astro (catalog/, layout, formulaires…)
  content/            collection produits : loader JSON, schémas, requêtes
  data/
    catalog/          products.<fournisseur>.json — le catalogue que le site lit (commité)
    category-*.json   mapping et corrections de catégories par fournisseur
    product-overrides.*.json, image-overrides.*.json   corrections de fiches et d'images
    suppliers/        exports bruts des fournisseurs — local uniquement, jamais commités
  i18n/, utils/, styles/
scripts/              génération et maintenance du catalogue (voir docs/scripts-catalogue.md)
tests/                tests unitaires et contrôles d'intégrité du catalogue
netlify/functions/    quote.mts — envoi des demandes de devis
docs/                 documentation (catalogue, images)
```

Le site ne lit **jamais** les exports fournisseurs au build : il lit les JSON pré-calculés de
`src/data/catalog/`. Une copie du dépôt sans les exports construit donc le site normalement ;
les exports ne servent qu'à régénérer le catalogue quand un fournisseur publie un nouveau fichier.

## Variables d'environnement

Voir [`.env.example`](.env.example) pour le détail :

- `RESEND_API_KEY` — clé Resend utilisée par la fonction de devis (à déclarer dans Netlify,
  scope « Functions »). Sans elle, l'envoi du formulaire échoue.
- `PUBLIC_PLAUSIBLE_DOMAIN` — active Plausible, chargé seulement après consentement.

## Déploiement et CI

- **Netlify** (`netlify.toml`) construit et publie à chaque push sur `main`, et publie une
  preview pour chaque pull request (projets protex-epi et protex-epo).
- **GitHub Actions** (`.github/workflows/ci.yml`) lance `astro check`, les tests et la
  vérification Prettier sur chaque pull request.

## Conventions

Les conventions du projet (serveur de dev, données catalogue, images) sont décrites dans
[`AGENTS.md`](AGENTS.md) (lu aussi via `CLAUDE.md`).
