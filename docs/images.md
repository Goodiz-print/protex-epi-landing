# Gestion des images (optimisation Astro)

Ce projet utilise le composant `<Image />` d'Astro (`astro:assets`) pour optimiser automatiquement les images : compression, conversion en formats modernes (`webp`/`avif`), calcul automatique de `width`/`height` (pas de layout shift) et lazy-loading.

## Où placer les fichiers

| Dossier | Usage | Optimisé par Astro ? |
| --- | --- | --- |
| `src/assets/images/` | Photos, illustrations, logos utilisés dans les composants `.astro` | ✅ Oui |
| `public/` | Fichiers statiques qui doivent garder un chemin/nom fixe (favicon, `robots.txt`, image `og:image` partagée par URL) | ❌ Non (servi tel quel) |

**Règle simple : par défaut, toute nouvelle image de contenu va dans `src/assets/images/`.**

## Ajouter une image

1. Déposer le fichier dans `src/assets/images/` (sous-dossiers autorisés, ex. `src/assets/images/produits/`).
2. L'importer et l'afficher avec le composant `Image` :

```astro
---
import { Image } from 'astro:assets';
import monVisuel from '../assets/images/mon-visuel.jpg';
---

<Image src={monVisuel} alt="Description de l'image" width={800} class="rounded-lg" />
```

- `alt` est obligatoire (accessibilité + SEO).
- `width` (ou `height`) suffit, Astro calcule le ratio à partir du fichier source.
- Ajouter `loading="eager"` uniquement pour les images visibles immédiatement au chargement (ex. image de Hero), sinon laisser le lazy-loading par défaut.

## Image distante (URL externe)

```astro
<Image src="https://exemple.com/photo.jpg" width={800} height={600} alt="..." />
```

Le domaine doit être autorisé dans `astro.config.mjs` :

```js
export default defineConfig({
  image: {
    domains: ['exemple.com'],
  },
});
```

## Ce qui reste dans `public/`

Seuls des fichiers dont l'URL doit rester fixe y sont servis tels quels : le favicon (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`), `robots.txt` et `images/product-placeholder.svg` (l'image de substitution des produits sans photo, référencée par son chemin dans le catalogue JSON). Le logo est déjà importé depuis `src/assets/images/` et affiché avec `<Image />` (voir `Header.astro`).

## Images produits

Les photos du catalogue ne passent pas par `astro:assets` : ce sont les URL des CDN fournisseurs, stockées dans `src/data/catalog/products.<fournisseur>.json`. Leur vérification et leur correction sont décrites dans `docs/scripts-catalogue.md` (procédures 3 et 4).

## Référence

Documentation officielle : https://docs.astro.build/en/guides/images/
