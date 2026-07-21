# VIGIE 2027 — agrégateur de sondages · Le Millénaire

Observatoire de tous les sondages de l'élection présidentielle française de
2027. Next.js 14 (App Router) · TypeScript · Tailwind · graphe SVG maison.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Données

Source réelle **unique** :
[**MieuxVoter/presidentielle2027**](https://github.com/MieuxVoter/presidentielle2027)
(licence **MIT**), `presidentielle2027.json` consommé en RAW, revalidation ISR
horaire. Aucun seed servi en prod — si le fetch échoue, l'UI affiche un état
« données indisponibles » honnête, jamais de faux chiffres. `lib/mieuxvoter.ts`.

- **Mapping** — table explicite `candidate_id → id maquette` (`MV_ID_MAP` dans
  `lib/candidates.ts`), établie en lisant `candidats.csv`. Tout `candidate_id`
  non mappé est **logué**, jamais jeté silencieusement.
- **Hypothèses** — libellés lisibles dérivés des candidats pivots
  (gauche · centre · droite · RN), jamais « H41 » brut. Sélecteur dédupliqué.
- **Tour** — 1er tour → courbe + classement ; 2nd tour → duels. Jamais mélangés.
- **Flux RSS** (BFMTV, Le Figaro, Les Échos, France Info) — fil d'actualité,
  filtré/dédupliqué. `lib/feed.ts` → `/api/feed` → `components/NewsTicker.tsx`.

Le **seed** (`lib/seed.ts`) ne subsiste que comme fixture de test.

### Agrégation

Moyenne mobile pondérée sur **4 semaines glissantes**, pondération
**40 / 30 / 20 / 10** du plus récent au plus ancien (par institut puis moyenne
inter-instituts), **regroupée par hypothèse comparable** (la plus testée
récemment = courbe principale, les autres via le sélecteur). `lib/aggregate.ts`.

## Alerte « nouveau sondage »

Double signal croisé : notifie seulement si (nouveau commit dans
`commits/main.atom`) **ET** (`.last_poll_count` en hausse). Un commit sans
hausse = correctif technique = pas d'alerte. `lib/updates.ts`, état persisté
dans `data/updates-state.json` (repli mémoire si FS en lecture seule).

- **Canal Slack** — `POST /api/check-updates` (cron Vercel horaire, `vercel.json`).
  Webhook lu depuis `SLACK_WEBHOOK_URL` (`.env.local`, non commité). Absent =
  skip proprement.
- **Badge header** — pastille « N nouveau(x) », remise à zéro quand le fil des
  sondages entre dans le viewport (`/api/seen`). `HeaderAlert` + `SeenBeacon`.

### Configurer Slack

Slack → https://api.slack.com/apps → votre app → **Incoming Webhooks** →
*Add New Webhook to Workspace* → copier l'URL dans `.env.local` :
`SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...` (voir `.env.example`).

## Routes

- `/` — tableau de bord (server component, ISR `revalidate = 3600`).
- `/api/polls` — charge agrégée complète depuis MieuxVoter (JSON).
- `/api/feed` — fil d'actualité RSS (JSON).
- `/api/check-updates` — vérifie/déclenche l'alerte nouveau sondage (dynamique).
- `/api/seen` — remet le compteur « non vus » à zéro (dynamique).

## Design

Tokens dans `tailwind.config.ts` + `app/globals.css`. Space Grotesk (titres),
Manrope (corps), JetBrains Mono (données). Palette navy + or, halos HUD, grille
46px, jamais de fond noir. Responsive automatique (< 760 mobile · < 1180
tablette · sinon web) via `hooks/useBreakpoint.ts`.

## Photos des candidats

Déposez `public/candidates/<id>.jpg` (voir `public/candidates/README.md`).
Fallback monogramme automatique si absent — aucune image cassée.

## Déploiement

Compatible Vercel (rien de spécifique à configurer ; l'ISR gère le rafraîchissement).

## Crédits

- **Données** : [MieuxVoter/presidentielle2027](https://github.com/MieuxVoter/presidentielle2027)
  (licence MIT) — instituts, commanditaires, terrains, échantillons, hypothèses.
- **Portraits des candidats** : issus de Wikimedia Commons sous licences libres ;
  auteur, licence et lien de chaque photo dans
  [`public/candidates/CREDITS.md`](public/candidates/CREDITS.md).
- **Actualité** : flux RSS des médias commanditaires.

## Licence

Code sous licence **MIT** (voir [`LICENSE`](LICENSE)). Les données (MieuxVoter,
MIT) et les portraits (licences libres Wikimedia, voir `CREDITS.md`) conservent
leurs licences respectives.

---

Édité par **Le Millénaire** · contact@lemillenaire.org · *Un sondage n'est pas une prévision.*
