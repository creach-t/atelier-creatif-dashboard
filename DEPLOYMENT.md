# 🚀 Guide de Déploiement

Ce guide vous accompagne pour déployer Cashly en production.

## 🎯 Architecture de déploiement

Cashly tourne en **Docker** sur un VPS auto-hébergé, derrière **Traefik** (reverse proxy + TLS Let's Encrypt) et un **tunnel Cloudflare** (accès SSH sécurisé au VPS, sans exposer le port 22). C'est le même modèle que les autres projets déployés sur `creachtheo.fr`.

```
GitHub (push sur main)
   │
   ▼
GitHub Actions : tests → build image Docker → push sur GHCR
   │
   ▼
SSH (via cloudflared + Cloudflare Access) → VPS
   │
   ▼
docker compose pull && up  →  container "cashly" (Express, port 3000)
   │
   ▼
Traefik (Host: cashly.creachtheo.fr) → HTTPS via Let's Encrypt
```

Le container embarque **à la fois** l'API (Express, [`server.js`](server.js)) et le build React statique — un seul service à déployer, pas de split frontend/backend.

## ⚙️ Configuration initiale du VPS (une seule fois)

Ces étapes supposent que Traefik (réseau Docker `traefik-public`) et le tunnel Cloudflare vers le VPS existent déjà (repris de l'infra `modern-cv-react`). Si ce n'est pas encore le cas, il faut d'abord le mettre en place avant de continuer.

1. **Ajouter le hostname au tunnel Cloudflare** : dans la configuration du tunnel existant (Cloudflare Zero Trust → Networks → Tunnels), ajoute une route publique pour `cashly.creachtheo.fr` si ton tunnel sert aussi l'ingress HTTP (sinon, il suffit que le DNS `cashly.creachtheo.fr` pointe vers le VPS, proxifié par Cloudflare, comme pour `creachtheo.fr`).
2. **Créer le dossier de déploiement** sur le VPS, ex : `/opt/deployments/cashly` (le chemin exact = valeur du secret `VPS_DEPLOY_PATH`, voir plus bas).
3. **Créer le fichier `.env`** dans ce dossier, à la main, en SSH sur le VPS (jamais via le CI, jamais commité) :
   ```bash
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=ta_cle_secrete_supabase
   ```
   Cashly étant multi-utilisateur, il n'y a plus de token Ko-fi ni de clé d'accès globale : chaque utilisateur connecte son propre Ko-fi via l'onboarding, et l'authentification passe par Supabase Auth. Seules les credentials Supabase restent nécessaires au runtime.
4. **Vérifier que le réseau Docker `traefik-public` existe** : `docker network ls | grep traefik-public` (sinon `docker network create traefik-public`).

## 🔄 Déploiement continu (GitHub Actions)

Le workflow [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) fait, à chaque push sur `main` :

1. **Tests & build** (`npm ci`, `npm test`, `npm run build`) — bloquant
2. **Audit de sécurité** (`npm audit`) — informatif, ne bloque jamais
3. **Build & push de l'image Docker** vers `ghcr.io/creach-t/atelier-creatif-dashboard`
4. **Déploiement** : connexion SSH au VPS via `cloudflared access ssh` (Cloudflare Access, service token), copie de `docker-compose.prod.yml`, puis `docker compose pull && up -d`

### Secrets GitHub à configurer

Repository → **Settings → Secrets and variables → Actions** → *New repository secret* :

| Secret | Description |
|---|---|
| `SSH_HOSTNAME` | Hostname SSH exposé par le tunnel Cloudflare (ex: `ssh.creachtheo.fr`) — identique à celui de `modern-cv-react` si même VPS |
| `SSH_USER` | Utilisateur SSH sur le VPS |
| `SSH_PRIVATE_KEY` | Clé privée SSH (format PEM) autorisée sur le VPS |
| `CF_ACCESS_CLIENT_ID` | Service token Cloudflare Access (ID) |
| `CF_ACCESS_CLIENT_SECRET` | Service token Cloudflare Access (secret) |
| `VPS_DEPLOY_PATH` | Chemin sur le VPS où vit `docker-compose.prod.yml` et `.env` (ex: `/opt/deployments/cashly`) — **différent** de celui de `modern-cv-react` |
| `GHCR_PAT` | Personal Access Token GitHub (scope `read:packages`) pour que le VPS puisse pull l'image, si elle n'est pas publique |
| `REACT_APP_SUPABASE_URL` | URL du projet Supabase — identique à `SUPABASE_URL`, dupliqué exprès (build-arg Docker, pas runtime) |
| `REACT_APP_SUPABASE_ANON_KEY` | Clé **publishable/anon** Supabase (pas la clé secrète !) — safe à exposer au navigateur, sert à l'authentification côté front |

⚠️ Ce sont des **secrets par repo** : même si le VPS/tunnel est partagé avec `modern-cv-react`, il faut les re-déclarer ici (avec les mêmes valeurs pour la partie infra, mais un `VPS_DEPLOY_PATH` propre à Cashly).

⚠️ `REACT_APP_SUPABASE_URL`/`REACT_APP_SUPABASE_ANON_KEY` sont utilisées comme **build-args Docker**, pas comme variables d'env du container — elles sont figées dans le bundle React au moment du `docker build`. Si tu changes de projet Supabase, il faut redéclencher un build (pas juste redémarrer le container).

### Rollback

```bash
# En SSH sur le VPS, dans le dossier de déploiement :
IMAGE_TAG=sha-<commit-court-précédent> docker compose -f docker-compose.prod.yml up -d --force-recreate
```
Les tags d'image (`sha-xxxxxxx`) sont visibles dans GitHub → Packages, ou dans l'historique des runs Actions.

## 🔍 Vérifier un déploiement

```bash
curl -I https://cashly.creachtheo.fr/health
# doit répondre 200 "ok"
```

En SSH sur le VPS :
```bash
docker ps --filter name=cashly
docker logs -f cashly
```

## 📱 PWA (Progressive Web App)

Le fichier `public/manifest.json` est déjà configuré (installable sur mobile/desktop, icônes). Le service worker CRA n'est pas activé par défaut — voir `src/index.js` (`reportWebVitals`) si tu veux l'ajouter plus tard pour du hors-ligne.

## 🐛 Dépannage

**Le build de l'image Docker échoue :**
```bash
docker build -t cashly:test .
```
Reproduit le build en local pour voir l'erreur exacte (souvent : dépendance manquante, ou `npm run build` qui échoue — teste `npm run build` seul d'abord).

**Le déploiement GitHub Actions échoue à l'étape SSH :**
- Vérifie que `cloudflared` (2026.5.1, épinglé dans le workflow) peut toujours joindre `SSH_HOSTNAME`
- Vérifie que le service token Cloudflare Access (`CF_ACCESS_CLIENT_ID`/`SECRET`) est toujours valide

**Le dashboard renvoie 401 après connexion :**
- Vérifie que `REACT_APP_SUPABASE_URL`/`REACT_APP_SUPABASE_ANON_KEY` utilisées au build correspondent bien au même projet Supabase que `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` côté serveur (un décalage entre les deux fait échouer la vérification du JWT)
- La session Supabase Auth est gérée par le SDK côté navigateur — un mode navigation privée ou des cookies/localStorage bloqués peuvent la faire perdre entre deux visites

**Les commandes Ko-fi n'arrivent pas pour un utilisateur :**
- Vérifie l'URL du webhook côté Ko-fi (`https://cashly.creachtheo.fr/api/kofi-webhook`, identique pour tous les comptes)
- Vérifie que le verification token collé dans l'onboarding (table `profiles.kofi_verification_token`) correspond exactement à celui affiché sur Ko-fi
- `docker logs cashly` sur le VPS pour voir l'erreur exacte (401 "Unknown verification token" = pas de profil trouvé avec ce token)

**Le container redémarre en boucle (`docker ps` montre `Restarting`) :**
- `docker logs cashly` — le cas le plus probable est `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` absents ou faux dans le `.env` du VPS

---

🎉 Pour toute question, consultez la [documentation](README.md) ou ouvrez une [issue](https://github.com/creach-t/atelier-creatif-dashboard/issues).
