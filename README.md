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

Source réelle **unique** : **Wikipédia** (CC BY-SA 4.0), article
[« Liste de sondages sur l'élection présidentielle française de 2027 »](https://fr.wikipedia.org/wiki/Liste_de_sondages_sur_l%27%C3%A9lection_pr%C3%A9sidentielle_fran%C3%A7aise_de_2027).
Le **wikitext brut** est récupéré via l'API MediaWiki (`action=parse`), pas le
HTML rendu, puis parsé défensivement. Revalidation ISR horaire. Aucun seed servi
en prod — si le fetch échoue, l'UI affiche « données indisponibles » honnête,
jamais de faux chiffres. `lib/wikipedia.ts`.

- **Parsing défensif** — tableaux à `rowspan` (un sondage = plusieurs hypothèses),
  colonnes candidats fixes, `{{blanc}}`/couleurs, décimales FR, réassignations de
  colonne (Hollande/Villepin…). Toute ligne non exploitable est **loguée** ; au-delà
  de 25 % de lignes perdues → état **« données partielles »**.
- **Mapping** — noms wiki → ids maquette par nom de famille (`resolveCandidateId`).
  Non-mappés **logués**, jamais jetés silencieusement.
- **Hypothèses** — libellés lisibles dérivés des candidats pivots
  (gauche · centre · droite · RN), jamais un code brut. Sélecteur dédupliqué.
- **Tour** — 1er tour (sections 2026) → courbe + classement ; 2nd tour (11 duels)
  → section Duels. Jamais mélangés.
- **Flux RSS** (BFMTV, Le Figaro, Les Échos, France Info) — fil d'actualité,
  filtré/dédupliqué. `lib/feed.ts` → `/api/feed` → `components/NewsTicker.tsx`.

Le **seed** (`lib/seed.ts`) ne subsiste que comme fixture de test.

### Agrégation

Moyenne mobile pondérée sur **4 semaines glissantes**, pondération
**40 / 30 / 20 / 10** du plus récent au plus ancien (par institut puis moyenne
inter-instituts), **regroupée par hypothèse comparable** (la plus testée
récemment = courbe principale, les autres via le sélecteur). `lib/aggregate.ts`.

Deux dates affichées : **« Dernier sondage : institut, dates »** (le sondage réel
le plus récent) et **« Données à jour au … »** (dernière agrégation). Pas de faux
badge « LIVE ».

## Alerte « nouveau sondage »

Signal réadapté à Wikipédia : on compare le **nombre de sondages 1er tour parsés**
au dernier compte mémorisé ; toute **hausse** = nouveau(x) sondage(s) → Slack +
badge. `lib/updates.ts`, état persisté dans `data/updates-state.json` (repli
mémoire si FS en lecture seule).

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
