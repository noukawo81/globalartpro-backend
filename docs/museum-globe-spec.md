# Musée-Globe — Spécification

Version: 0.1
Date: 2025-12-29
Auteur: équipe GlobalArtPro

## Vision (résumé)
Un musée-monde flottant : une **sphère transparente** suspendue dans un vide blanc infini où 100 œuvres culturelles « respirent » — l'expérience vise la contemplation, l'éducation et le respect. Ce prototype met l'accent sur les objets sacrés, les masques, textiles, proverbes et rituels — pas la spéculation NFT.

## Objectifs
- Offrir un parcours contemplatif, non-commercial, focalisé sur la profondeur contextuelle de chaque œuvre.
- Fournir une interface curatoriale pour la sélection, l'annotation et la préservation des métadonnées culturales.
- Fournir un prototype technique (2D concentric) puis un rendu 3D sphérique (three.js) avec bon fallback et accessibilité.

## Non-goals
- Plateforme de vente NFT et marketplace spéculative.
- Rendre une restitution exhaustive d'objets patrimoniaux (ce projet vise un ensemble sélectif de 100 œuvres).

---

## Principes de design
- Silence et respiration : pas de musique d'ambiance agressive par défaut. Audio optionnel et discret.
- Respect des communautés : champs de métadonnées pour provenance, consentement, restrictions d'usage.
- Accessibilité : navigation clavier, focus-trap dans modals, textes lisibles, contraste élevé.
- Performance & mobile-first : LOD, images optimisées, fallback 2D pour appareils mobiles.

---

## Organisation spatiale & UX
### Globe physique (concept)
- Sphère transparente de 50m (concept), marche sur une surface blanche qui se fond dans l'horizon.
- 7 cercles concentriques (Racines, Paroles, Corps, Terre, Ciel, Passage, Futur).
- Les cercles forment des bandes sur lesquelles les œuvres sont placées en positions régulières (anneaux).

### Parcours visiteur (scénarios)
- Entrée libre : l'utilisateur arrive au centre, voit les 7 anneaux et peut "zoomer" / cliquer sur une œuvre.
- Détail d'œuvre (modal) : images haute résolution, audio contextuel (ex : explication), métadonnées, provenance, textes traduits.
- Filtrage : par cercle, par origine géographique, par mots-clés.
- Mode méditatif : navigation guidée (sélection automatique d'une œuvre toutes les N secondes) — optionnelle.

### Parcours curateur
- Dashboard de curation : créer/éditer œuvre, ajouter médias, marquer restrictions, approuver publication.
- Workflows : Draft → Review → Published. Historique des modifications.

---

## Modèle de données (JSON)
Chaque œuvre a le schéma minimal suivant (exemple):

```json
{
  "id": "globe-0001",
  "title": "Masque de l'ancêtre",
  "origin": "Pays X / Région Y",
  "circle": "Racines",
  "year": "XIXe siècle",
  "description": "Masque cérémoniel utilisé pour ...",
  "media": [
    {"type": "image", "url": "minio://bucket/path/001.jpg", "caption": "vue frontale", "width": 2048, "height": 1536},
    {"type": "audio", "url": "minio://bucket/path/001.mp3", "caption": "explication (FR)", "duration": 120}
  ],
  "provenance": "Don de la communauté A, document X",
  "rights": { "use": "non-commercial", "sensitive": true },
  "tags": ["masque", "initiation"],
  "displayOrder": 10,
  "translations": { "fr": {"title":"...","description":"..."}, "en": {...} }
}
```

Validation : tous les objets doivent contenir `id`, `title`, `circle`, `media` (au moins 1), `provenance`, `rights`.

---

## Endpoints API
- GET /api/museum/globe
  - Query params: `circle`, `q` (texte), `limit`, `offset`
  - Returns: paginated list of artworks
- GET /api/museum/globe/:id
  - Returns full record
- POST /api/museum/globe (admin)
  - Create an artwork (authenticated, curator role)
- PUT /api/museum/globe/:id (admin)
- DELETE /api/museum/globe/:id (admin)
- POST /api/museum/globe/:id/upload (admin)
  - Upload media via MinIO or fallback local storage

Sécurité : endpoints admin protégés par JWT + rôle `curator` ou `admin`.

---

## UI Prototype (concentric 2D fallback)
Phase 1: implémenter `MuseumGlobe.jsx` (React) avec rendu SVG/CSS des 7 anneaux concentriques :
- Anneaux disposés en cercles centrés ; chaque œuvre est un point cliquable dont la taille varie légèrement selon importance.
- Cliquer -> modal d'œuvre (accessible)
- Responsive : petits écrans = liste verticale filtrable (pas de cercle)

Wireframe basique :
- Header: titre + filtres
- Full area: SVG circles + clickable nodes
- Right rail: selected artwork preview & details

---

## Accessibilité
- Tous les contrôles doivent être accessibles clavier (tab, arrow navigation pour anneaux).
- Modals: focus trap, close via ESC.
- Images fournies avec `alt` et `caption`.
- A11y tests: axe-core run on CI for the Museum page.

---

## Harvest / Curation rules & policies
- Champ `rights` obligatoire : `non-commercial` par défaut pour objets sensibles.
- Champ `sensitive` (boolean) : si true, contenu restreint et nécessite approbation avant publication.
- Metadata de provenance et consentement (texte libre + liens vers preuves) obligatoires pour `sensitive=true`.

---

## Tests & Critères d'acceptation (AC)
AC1 — API : GET /api/museum/globe retourne liste paginée, filtre par `circle` et `q`. Tests d'intégration (supertest).
AC2 — Curator flows : POST/PUT/DELETE nécessitent rôle `curator`; tests d'intégration.
AC3 — UI Prototype : `MuseumGlobe.jsx` affiche 7 cercles, clic ouvre modal, navigation clavier supportée; tests e2e basiques (puppeteer / Playwright).
AC4 — a11y : axe-core passe sur page principale.
AC5 — Seed: inclure 10 œuvres réparties sur les 7 cercles pour la démo.

---

## Plan d'implémentation (phases)
1. Rédaction de la spec (ce document). ✅
2. Seed: `data/museum_globe.json` avec 10 exemples. (tâche suivante)
3. Backend: endpoints + tests.
4. Frontend: `MuseumGlobe.jsx` 2D concentric + modal.
5. Accessibility & e2e tests.
6. Prototype 3D: three.js (progressive enhancement).

---

## Déploiement & CI
- Ajouter workflow GitHub Actions pour exécuter : `cd backend && npm test` et `cd frontend && npm test` (ajouté pour backend — à étendre au frontend).
- Health check: `/api/health` indiqué DB type & status.

---

## Annexes: Exemples d'œuvres (seed minimal)
```json
[
  {"id":"g-001","title":"Masque A","circle":"Racines","origin":"Région X","media":[{"type":"image","url":"/data/sample/masque-a.jpg"}],"provenance":"Don X","rights":{"use":"non-commercial","sensitive":true}},
  {"id":"g-002","title":"Proverbe B","circle":"Paroles","origin":"Région Y","media":[{"type":"text","url":"/data/sample/proverbe-b.txt"}],"provenance":"Collecte orale","rights":{"use":"non-commercial"}},
  {"id":"g-003","title":"Tissu C","circle":"Corps","origin":"Région Z","media":[{"type":"image","url":"/data/sample/tissu-c.jpg"}],"provenance":"Musée local","rights":{"use":"non-commercial"}}
]
```

---

## Prochaine étape (immédiate)
- Créer le fichier seed `backend/data/museum_globe.json` avec 10 entrées d'exemple et ajouter tests d'intégration pour `GET /api/museum/globe`.

---

Merci — dites-moi si vous voulez que je crée le seed et implémente l'endpoint maintenant (je peux m'en charger et ouvrir une PR séparée pour l'implémentation backend).