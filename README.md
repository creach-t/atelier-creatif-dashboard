# 💸 Cashly

> **Dashboard de gestion de ventes multi-canal pour créatifs indépendants**

Une solution complète pour gérer efficacement vos commandes Ko-fi, vos ventes en boutique partenaire (Reel), vos produits et vos expéditions, le tout dans une interface moderne aux couleurs pastels.

![Dashboard Preview](https://img.shields.io/badge/Version-1.0.0-purple)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.3.2-teal)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Fonctionnalités

### 👥 **Multi-utilisateur**
- Chaque créateur a son propre compte (Supabase Auth), ses propres commandes/produits — isolation totale via Row Level Security
- Parcours d'inscription guidé : connecter son Ko-fi (token + URL de webhook) puis importer l'historique des ventes passées (CSV Ko-fi)

### 🌐 **Multi-canal**
- **Ko-fi** : commandes/paiements synchronisés automatiquement via webhook (identifié par compte via le verification token)
- **Reel** : ventes physiques/personnalisées saisies manuellement, avec suivi de la boutique partenaire
- D'autres canaux pourront être ajoutés par la suite (le canal est une donnée, pas du code en dur)

### 📊 **Dashboard Principal**
- Vue d'ensemble avec métriques visuelles
- Revenus total, commandes en attente, alertes stock
- Répartition des revenus par canal
- Commandes récentes et produits populaires

### 🛒 **Gestion des Commandes**
- Ajout manuel (Reel, ou Ko-fi de secours) et suivi des commandes
- Filtrage par canal, par statut et recherche avancée
- Gestion des statuts (En attente → Expédiée → Livrée)

### 🎯 **Catalogue Produits**
- Gestion complète du stock
- Alertes stock faible automatiques
- Catégorisation et recherche

### 📦 **Modules Futurs**
- Intégration expéditions La Poste
- Rapports et analyses détaillées
- Nouveaux canaux de vente

## 🚀 Installation Rapide

### Prérequis
- Node.js 16+
- npm ou yarn
- Un compte [Supabase](https://supabase.com) (gratuit) pour la base de données
- Un compte Ko-fi avec l'accès aux webhooks (Settings → API)

### Étapes d'installation

```bash
# 1. Cloner le repository
git clone https://github.com/creach-t/atelier-creatif-dashboard.git
cd atelier-creatif-dashboard

# 2. Installer les dépendances
npm install
```

### Configuration du backend (Supabase + Ko-fi)

Cashly est multi-utilisateur : l'authentification (**Supabase Auth**) isole les données de chaque créateur, et chaque créateur connecte son propre Ko-fi via l'onboarding (pas de config globale). Le backend est un petit serveur **Express** ([`server.js`](server.js), routes dans [`api/`](api)) qui sert à la fois l'API et le build React — déployé en Docker sur un VPS, derrière Traefik et un tunnel Cloudflare (voir [DEPLOYMENT.md](DEPLOYMENT.md)). La donnée vit dans **Supabase** (Postgres géré).

1. **Créer le projet Supabase**
   - Sur [app.supabase.com](https://app.supabase.com), crée un nouveau projet.
   - Dans l'éditeur SQL du projet, exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql) (installation neuve) — ça crée les tables `profiles`, `orders`, `products`, le trigger qui crée un profil à chaque inscription, et les policies RLS. Pour une base existante créée avant le passage multi-utilisateur, utilise plutôt [`supabase/migrations/0002_multi_tenant.sql`](supabase/migrations/0002_multi_tenant.sql).
   - Dans *Project Settings → API Keys*, récupère l'**URL du projet**, la **clé secrète** (`sb_secret_...`, ou `service_role` si l'ancien système) — jamais exposée au navigateur — et la **clé publishable** (`sb_publishable_...`, ou `anon`) — celle-là est safe à exposer au front, elle sert à l'authentification.

2. **Variables d'environnement**
   - Copie `.env.example` vers `.env.local` (déjà ignoré par git) et remplis :
     - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — utilisées côté serveur uniquement
     - `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` — utilisées côté front (authentification), doivent être connues **au build**, pas seulement au runtime (voir [DEPLOYMENT.md](DEPLOYMENT.md) pour la prod)
   - Il n'y a plus de token d'accès global ni de token Ko-fi global : chaque utilisateur configure son propre Ko-fi (verification token) depuis l'écran d'onboarding après inscription, stocké dans `profiles.kofi_verification_token`.

3. **Ko-fi** : rien à configurer côté serveur — chaque utilisateur, une fois son compte créé, connecte son Ko-fi lui-même via l'écran d'onboarding (URL de webhook affichée + champ pour coller son verification token), avec un import optionnel de l'historique (CSV Ko-fi : More → Transactions → Download CSV).

### Démarrer en développement

```bash
npm run dev
```

Lance en parallèle le serveur React (`react-scripts start`, port 3000) et l'API Express (port 4000) ; les appels `/api/*` du front sont automatiquement redirigés vers l'API grâce au champ `proxy` de `package.json`. Pour ne travailler que sur l'UI sans backend, `npm start` seul reste disponible mais les appels `/api/*` échoueront.

🎉 **Votre dashboard sera accessible sur http://localhost:3000**

## 🎨 Design System

### Palette de Couleurs
```css
/* Couleurs principales */
--purple-primary: #8b5cf6    /* Violet principal */
--pink-primary: #f472b6      /* Rose accent */
--purple-light: #faf7ff      /* Fond violet clair */
--pink-light: #fdf2f8        /* Fond rose clair */
```

### Typographie
- **Police principale :** Inter (Google Fonts)
- **Tailles :** 12px - 32px avec échelle harmonieuse
- **Graisses :** 300, 400, 500, 600, 700

### Composants
- **Cards :** Coins arrondis 16px, ombres subtiles
- **Buttons :** Gradients fluides, animations micro
- **Icons :** Lucide React pour la cohérence

## 📱 Responsive Design

| Breakpoint | Largeur | Description |
|------------|---------|-------------|
| Mobile     | < 768px | Navigation adaptée, grilles 1 colonne |
| Tablet     | 768px+  | Sidebar réduite, grilles 2-3 colonnes |
| Desktop    | 1024px+ | Layout complet, grilles 4+ colonnes |

## 🛠️ Structure du Projet

```
server.js                   # Serveur Express : sert l'API (routes ci-dessous) + le build React

api/                         # Routes API (montées par server.js)
├── lib/
│   ├── supabaseClient.js   # Client Supabase (clé secrète, côté serveur uniquement)
│   ├── auth.js             # Vérification du JWT de session Supabase Auth
│   └── kofiMapper.js       # Traduction payload Ko-fi -> commande
├── kofi-webhook.js         # Réception des webhooks Ko-fi (résout le compte via profiles.kofi_verification_token)
├── orders.js                # GET (liste, filtre ?channel=) / POST (création manuelle) — filtré par user_id
├── orders/[id].js           # PATCH (statut, tracking)
├── orders/import.js          # POST — import de l'historique Ko-fi (CSV, onboarding)
├── products.js               # GET / POST — filtré par user_id
├── products/[id].js          # PATCH / DELETE
└── profile.js                 # GET / PATCH — display_name, kofi_verification_token, onboarding_completed

Dockerfile                   # Build multi-stage : React puis image Node/Express de prod
docker-compose.prod.yml      # Service Docker + labels Traefik (cashly.creachtheo.fr)

supabase/
├── schema.sql              # Schéma complet (installation neuve, multi-utilisateur)
└── migrations/0002_multi_tenant.sql  # Migration additive pour une base existante

src/
├── App.js                  # Routage selon l'état du compte (login → onboarding → dashboard)
├── api/
│   ├── client.js            # Wrapper fetch (JWT Supabase, gestion des erreurs)
│   └── supabaseClient.js    # Client Supabase côté navigateur (clé publishable, auth uniquement)
├── hooks/                  # useOrders, useProducts (fetch + mutations)
├── components/
│   ├── ui/                 # Card, Button, Badge, ChannelBadge
│   ├── layout/              # Sidebar, Header
│   ├── auth/Login.js        # Écran de connexion / inscription (Supabase Auth)
│   ├── onboarding/           # Connexion Ko-fi + import de l'historique (CSV)
│   ├── dashboard/           # Dashboard + répartition par canal
│   ├── orders/               # Liste des commandes + formulaire de saisie
│   └── products/             # Catalogue produits
├── utils/                    # parseCsv.js, normalizeKofiCsv.js
├── index.js                 # Point d'entrée React
└── index.css                 # Styles Tailwind + custom

public/
├── index.html               # Template HTML
├── manifest.json             # PWA config
└── favicon.ico               # Icône
```

## ⚙️ Personnalisation

### Changer les Couleurs
```javascript
// tailwind.config.js
colors: {
  primary: '#votre-couleur',
  secondary: '#votre-couleur-2'
}
```

### Ajouter des Produits
Les produits vivent dans Supabase, pas dans le code, et sont propres à chaque compte (`user_id`). Ajoute une ligne dans la table `products` via l'éditeur Supabase, ou `POST /api/products` avec ton JWT de session en `Authorization: Bearer ...` (récupérable via `supabase.auth.getSession()` depuis la console du navigateur une fois connecté).

### Personnaliser le Branding
1. Remplacez "Cashly" par votre nom dans [`src/components/layout/Sidebar.js`](src/components/layout/Sidebar.js), [`src/components/auth/Login.js`](src/components/auth/Login.js), `public/index.html` et `public/manifest.json`
2. Modifiez les gradients de couleur
3. Ajoutez votre logo dans la sidebar

## 🔧 Scripts Disponibles

```bash
npm start          # Front seul (http://localhost:3000), sans backend
npm run server     # API Express seule (port 3000 par défaut, ou PORT=xxxx)
npm run dev        # Front + API ensemble, avec proxy /api -> API (dev complet)
npm run build      # Build production
npm test           # Tests unitaires
npm run eject      # Éjection Create React App (⚠️ irréversible)
```

## 📈 Évolutions Futures

### Version 1.1
- [ ] Intégration API Ko-fi
- [ ] Notifications en temps réel
- [ ] Export des données (CSV/PDF)

### Version 1.2
- [ ] Mode sombre/clair
- [ ] Calcul automatique frais de port
- [ ] Gestion multi-devises

### Version 2.0
- [ ] Application mobile (React Native)
- [ ] Synchronisation cloud
- [ ] Analyses avancées avec graphiques

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le repository
2. **Créez** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** sur la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation :** Lisez ce README
- **Issues :** [GitHub Issues](https://github.com/creach-t/atelier-creatif-dashboard/issues)
- **Discussions :** [GitHub Discussions](https://github.com/creach-t/atelier-creatif-dashboard/discussions)

## 💝 Remerciements

- **React Team** pour le framework
- **Tailwind CSS** pour le système de design
- **Lucide** pour les icônes élégantes
- **Supabase** pour la base de données
- **Traefik** & **Cloudflare** pour l'infra de déploiement

---

<div align="center">
  <p>Fait avec 💜 pour les créatifs</p>
  <p>⭐ Star ce repo si il vous a aidé !</p>
</div>