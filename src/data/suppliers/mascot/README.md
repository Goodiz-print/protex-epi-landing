# Fournisseur Mascot — structure des données & intégration

Ce dossier contient les exports bruts Mascot et le CSV allégé qui alimente le catalogue.
Ce README documente la **structure des données Mascot** et la **démarche d'intégration**
(déjà implémentée), pour pouvoir régénérer et compléter le catalogue par la suite.

Mascot est le **3ᵉ fournisseur**, après Portwest et Blaklader. Le pipeline, le schéma produit
et les pages du catalogue sont fournisseur-agnostiques : intégrer Mascot n'a demandé **aucune
modification des routes ni des composants**.

---

## 1. Fichiers du dossier

| Fichier | Rôle | Versionné ? |
|---|---|---|
| `MASCOT_extended_productdata_FR.csv` | **Maître** — 291 Mo, 96 colonnes, ~41 399 lignes (1/variante EAN), ~937 produits. Images, composition, type, tailles, description. | ❌ gitignoré (trop volumineux, local seulement) |
| `Produits-Table 1.csv` | Prix **2025 + 2026** propres + nom commercial. ~3 047 articles (1 ligne/taille). | ❌ gitignoré |
| `Retouches-Table 1.csv` | Services de retouche (poches genoux, reconditionnement…). **Non-produits, ignoré.** | ❌ gitignoré |
| `mascot-products.slim.csv` | **CSV allégé** produit par `scripts/prepare-mascot-csv.mjs` — 33 Mo, 12 colonnes. **C'est le seul fichier lu au runtime.** | ✅ committé |

Format des exports bruts : **UTF-8, délimiteur `;`, décimales à virgule** (`132,95`), retours
CRLF, champs multi-lignes entre guillemets. ⚠️ Plusieurs en-têtes contiennent des **espaces
insécables** (U+00A0), ex. `Images produit 1 000 px` — normalisées à la lecture.

---

## 2. Hiérarchie des codes Mascot

```
Numéro de produit            18001            → clé de MAPPING catégorie (niveau produit)
 └ Numéro de produit-qualité 18001-249        → styleCode / référence article affichée
    └ …-coloris              18001-249-010     → clé de GROUPE (= 1 fiche produit d'une couleur)
       └ Taille UE           2XL, 3XL, …       → variantes de taille dans le groupe
```

Une **fiche produit** = un `Numéro de produit-qualité-coloris`. Les tailles sont les `Taille UE`
distinctes du groupe (informationnelles, non commandables — le site est une vitrine).

---

## 3. Correspondance des champs → schéma `Product`

Schéma cible : `src/content/schemas/product.ts`.

| Champ `Product` | Source (dans le slim CSV / extended) |
|---|---|
| clé de groupe | `produitQualiteColoris` (extended `Numéro de produit-qualité-coloris`) |
| `styleCode` | `produitQualite` (`Numéro de produit-qualité`) |
| `colour` | `coloris` (`Coloris`) |
| `name` | `nom` = `NOM DE PRODUIT` de Produits-Table (jointure EAN) ; repli `Nom du produit (ancien)` |
| `description` | `texteTechnique` (`Texte technique`) ; repli `qualite` (composition) |
| `price` | **min** des `prix2026` du groupe (`NEW - PRIX 2026 BRUT H.T.`, jointure EAN). Le prix varie par taille → on affiche le plus bas (« à partir de »). |
| `imageUrl` | `image1000` — 1ʳᵉ URL de `Images produit 1 000 px` (`https://pimage.mascot.fr/…`) |
| `sizes` | `taille` (`Taille UE`) collapsé sur le groupe |
| `category` / `subcategory` | via `src/data/category-mapping.mascot.json`, clé = `produit` |
| `sourceSkus` | `ean` (`Numéro EAN`) de chaque ligne |

### Jointure prix + nom (par EAN)

Le fichier extended porte les images/description mais un `Prix` non fiable ; les prix 2026 propres
sont dans `Produits-Table`. On les joint sur le **`CODE EAN`** (= `Numéro EAN`), seule clé fiable
ligne-à-ligne : le code article a une largeur de coloris différente entre les deux fichiers
(`…-010` vs `…-01`). **Couverture : 99 % des lignes** trouvent un prix 2026.

### Images

Photos produit sur `https://pimage.mascot.fr/<produit-qualité-coloris>_P01_1000pxweb.jpg`
(nommage **déterministe**, ex. `18001-249-010_P01_1000pxweb.jpg`) → **100 % de couverture**.
Le host `pimage.mascot.fr` est autorisé dans `astro.config.mjs` (`image.domains`). L'autre host
`mascotsitecore-…kxcdn.com` ne porte que pictos/symboles de lavage/certifs (non utilisés).

---

## 4. Classification catégories

Cible : la taxonomie du site dans `src/data/category-taxonomy.ts`
(`tete`, `corps`, `mains`, `pieds`, `usage-unique`, `collectivites`, + `a-trier`).

Mascot fournit une colonne `Type de produit` fine (« Veste d'extérieur », « Pantalon »,
« Bottines de sécurité »…). `scripts/generate-category-mapping-mascot.mjs` la classe par
**mots-clés** (ordre le plus spécifique d'abord) vers `category-mapping.mascot.json`,
keyé sur `Numéro de produit` (~937 clés). Additif : ne réécrit **jamais** une entrée existante
(les corrections manuelles sont préservées).

Résultat actuel : **880 / 937 (94 %)** classés — corps 756, pieds 106, tête 18 — **57 en `a-trier`**.

### Points à revoir manuellement

- **`a-trier` (57)** : accessoires non couverts par la taxonomie — capuches, poches flottantes,
  ceintures, genouillères, tour de cou, porte-marteau/badge, sac, spray imperméabilisant.
  Corriger au besoin dans `category-mapping.mascot.json`.
- **Coiffe textile → `tete/protection-tete`** (bonnets, bérets, casquettes, chapeaux, cagoules) :
  mappé par défaut, mais ce ne sont pas des casques de protection — à valider.
- **Haute visibilité** : le `Type de produit` d'un vêtement hi-vis reste souvent générique
  (« Pantalon », « Veste »), donc ces articles tombent en `corps/vetements-travail` plutôt que
  `vetements-haute-visibilite`. Pour les détecter il faudrait s'appuyer sur `Catégories de produit`
  ou `Segments` (non repris dans le slim actuel).

---

## 5. Workflow de (ré)génération

À refaire à chaque nouvel export Mascot :

```bash
# 1. Déposer les 3 CSV bruts dans src/data/suppliers/mascot/
# 2. Distiller le fichier maître (+ jointure prix/nom par EAN) → slim CSV committé
node scripts/prepare-mascot-csv.mjs

# 3. (Re)générer les suggestions de mapping catégorie (additif, ne réécrit rien)
node scripts/generate-category-mapping-mascot.mjs

# 4. Vérifier en dev, puis committer mascot-products.slim.csv + category-mapping.mascot.json
npx astro dev --background && npx astro dev logs   # doit afficher : [mascot] loaded 3025 products …
```

Fichiers de code impliqués :

- `scripts/prepare-mascot-csv.mjs` — distillation extended + jointure prix (streaming, 291 Mo).
- `scripts/generate-category-mapping-mascot.mjs` — mapping par mots-clés sur `Type de produit`.
- `src/content/loaders/csv-products-loader.helpers.ts` — `groupMascotRows`, `buildMascotEntry`.
- `src/content/loaders/csv-products-loader.ts` — source `mascot` (lecture slim en `;`).
- `src/content.config.ts` — déclaration de la source Mascot.
- `astro.config.mjs` — `pimage.mascot.fr` dans `image.domains`.

> ℹ️ `astro build` sort en code 1 à cause d'images **Portwest** mortes (404 CDN) — problème
> préexistant sans rapport avec Mascot ; `dist/` est tout de même généré intégralement.
