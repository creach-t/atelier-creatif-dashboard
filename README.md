# 💸 Cashly

> **Dashboard de gestion de ventes multi-canal pour créatifs indépendants**

Une solution complète pour gérer efficacement vos commandes Ko-fi, vos ventes en boutique partenaire (Reel), vos produits, vos clients et vos expéditions, le tout dans une interface moderne aux couleurs pastels.

![Dashboard Preview](https://img.shields.io/badge/Version-1.0.0-purple)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.3.2-teal)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Fonctionnalités

### 👥 **Multi-utilisateur**
- Chaque créateur a son propre compte (Supabase Auth), ses propres commandes/produits/clients — isolation totale via Row Level Security
- Pas d'onboarding forcé : un nouveau compte arrive direct sur un dashboard vide, et connecte ses sources (Ko-fi) quand il veut, depuis **Réglages**

### 🌐 **Multi-canal**
- **Ko-fi** : commandes/paiements synchronisés automatiquement via webhook (identifié par compte via le verification token), enrichit aussi le catalogue produits et les fiches clients automatiquement
- **Reel** : ventes physiques/personnalisées saisies manuellement
- D'autres canaux pourront être ajoutés par la suite (le canal est une donnée, pas du code en dur)

### ⚙️ **Réglages**
- Connexion/déconnexion Ko-fi (verification token, URL de webhook) à tout moment, pas juste à l'inscription
- Import de l'historique Ko-fi (CSV) réutilisable — corrige aussi les données déjà importées en cas de bug
- Édition du nom affiché

### 📊 **Dashboard Principal ("Vue d'ensemble")**
- Mois navigable (chevrons précédent/suivant) plutôt que figé sur le mois courant
- Revenus du mois, commandes en attente, produits catalogués, expédiées aujourd'hui — chaque carte cliquable renvoie vers la page concernée (filtrée quand ça a du sens)
- Graphiques Recharts : évolution des revenus sur 6 mois, répartition par canal (donut)
- Commandes récentes et produits populaires cliquables → ouvrent leur détail en popup, sans changer d'onglet
- Notifications (activité récente) accessibles depuis la cloche du header

### 🛒 **Gestion des Commandes**
- Client **obligatoire**, saisi via une recherche dans le carnet existant (auto-complétion) — un nom sans correspondance devient un nouveau client (créé automatiquement, [`api/lib/customerSync.js`](api/lib/customerSync.js))
- Articles ajoutés de la même façon : recherche dans le catalogue produits, ou nouvel article → nouveau produit créé automatiquement (catégorie "Sans catégorie" à préciser ensuite)
- Note libre optionnelle par commande
- Ligne de commande cliquable → détail complet en popup (articles, statut, n° de suivi, note), sans jamais changer d'onglet — pareil pour un article cliqué depuis ce détail (ouvre la fiche produit en popup)
- Filtrage par canal, statut, période (7j/30j/année/tout) et recherche

### 🎯 **Catalogue Produits**
- Enrichi automatiquement à partir des ventes Ko-fi (nom, photo et lien Ko-fi direct quand disponibles dans la boutique)
- Pas de gestion de stock — la métrique qui compte est la **quantité vendue**, calculée depuis les commandes
- Fiche produit en deux étapes : cliquer une carte ouvre une vue (photo, prix, ventes, lien Ko-fi), "Modifier" seulement ensuite pour éditer
- Tri (plus/moins vendus, nom, prix croissant/décroissant, plus récents), recherche, mini-classement "Top 5 des ventes" en graphique

### 🧑‍🤝‍🧑 **Clients**
- Fiche client persistée en base (nom, email, notes), créée automatiquement à chaque nouvelle commande
- Fiche détaillée en popup : email, notes, badges (VIP/Fidèle/Généreux·se/Super fan), et tout l'historique de ses commandes — chacune cliquable pour ouvrir son détail
- Tri (total dépensé, nom, nombre de commandes, dernière commande), "Top 5 des client·es" en graphique

### 📈 **Rapports et Analyses**
- Évolution mensuelle des revenus (graphique), répartition par canal, revenus par jour de la semaine
- Classement des clients (avec badges VIP/Fidèle/Généreux·se/Super fan) et des produits par quantité vendue — chaque ligne cliquable ouvre la vraie fiche (client/produit) en popup, sans quitter Rapports
- Filtre par année

### 📦 **Modules Futurs**
- Intégration expéditions La Poste
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

Cashly est multi-utilisateur : l'authentification (**Supabase Auth**) isole les données de chaque créateur, et chaque créateur connecte son propre Ko-fi depuis Réglages (pas de config globale). Le backend est un petit serveur **Express** ([`server.js`](server.js), routes dans [`api/`](api)) qui sert à la fois l'API et le build React — déployé en Docker sur un VPS, derrière Traefik et un tunnel Cloudflare (voir [DEPLOYMENT.md](DEPLOYMENT.md)). La donnée vit dans **Supabase** (Postgres géré).

1. **Créer le projet Supabase**
   - Sur [app.supabase.com](https://app.supabase.com), crée un nouveau projet.
   - Dans l'éditeur SQL du projet, exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql) (installation neuve) — ça crée les tables `profiles`, `orders`, `products`, `customers`, le trigger qui crée un profil à chaque inscription, et les policies RLS. Pour une base existante, applique dans l'ordre les migrations de [`supabase/migrations/`](supabase/migrations) (`0002_multi_tenant.sql`, `0003_customers.sql`, `0004_products_kofi_link.sql`, `0005_orders_notes.sql`).
   - Dans *Project Settings → API Keys*, récupère l'**URL du projet**, la **clé secrète** (`sb_secret_...`, ou `service_role` si l'ancien système) — jamais exposée au navigateur — et la **clé publishable** (`sb_publishable_...`, ou `anon`) — celle-là est safe à exposer au front, elle sert à l'authentification.

2. **Variables d'environnement**
   - Copie `.env.example` vers `.env.local` (déjà ignoré par git) et remplis :
     - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — utilisées côté serveur uniquement
     - `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` — utilisées côté front (authentification), doivent être connues **au build**, pas seulement au runtime (voir [DEPLOYMENT.md](DEPLOYMENT.md) pour la prod)
   - Il n'y a pas de token d'accès global ni de token Ko-fi global : chaque utilisateur configure son propre Ko-fi (verification token) depuis **Réglages**, stocké dans `profiles.kofi_verification_token`.

3. **Ko-fi** : rien à configurer côté serveur — chaque utilisateur connecte son Ko-fi lui-même depuis **Réglages** (URL de webhook affichée + champ pour coller son verification token), avec un import réutilisable de l'historique (CSV Ko-fi : More → Transactions → Download CSV).

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

La sidebar devient un menu coulissant (hamburger dans le header) sous `md` (768px) — avant ça, l'appli était inutilisable sur téléphone. Les tableaux (Commandes, Clients) masquent leurs colonnes secondaires sur petit écran plutôt que de forcer un scroll horizontal.

| Breakpoint | Largeur | Description |
|------------|---------|-------------|
| Mobile     | < 768px | Sidebar en overlay, colonnes secondaires masquées, grilles 1-2 colonnes |
| Tablet     | 768px+  | Sidebar fixe, grilles 2-3 colonnes |
| Desktop    | 1024px+ | Layout complet, grilles 4+ colonnes |

## 🛠️ Structure du Projet

```
server.js                   # Serveur Express : sert l'API (routes ci-dessous) + le build React

api/                         # Routes API (montées par server.js)
├── lib/
│   ├── supabaseClient.js   # Client Supabase (clé secrète, côté serveur uniquement)
│   ├── auth.js             # Vérification du JWT de session Supabase Auth
│   ├── kofiMapper.js       # Traduction payload webhook Ko-fi -> commande
│   ├── productSync.js       # Auto-création de produits à partir des articles vendus (Ko-fi)
│   └── customerSync.js       # Auto-création de fiches clients à partir des commandes
├── kofi-webhook.js         # Réception des webhooks Ko-fi (résout le compte via profiles.kofi_verification_token)
├── orders.js                # GET (liste triée par order_date, filtre ?channel=) / POST — filtré par user_id
├── orders/[id].js           # PATCH (statut, tracking, notes)
├── orders/import.js          # POST — import/réimport de l'historique Ko-fi (CSV)
├── products.js               # GET / POST — filtré par user_id
├── products/[id].js          # PATCH / DELETE
├── customers.js               # GET / POST — filtré par user_id
├── customers/[id].js          # PATCH / DELETE
└── profile.js                 # GET / PATCH — display_name, kofi_verification_token

Dockerfile                   # Build multi-stage : React puis image Node/Express de prod
docker-compose.prod.yml      # Service Docker + labels Traefik (cashly.creachtheo.fr)

supabase/
├── schema.sql              # Schéma complet (installation neuve, multi-utilisateur)
└── migrations/              # 0002 à 0005 — migrations additives (multi-tenant, clients, lien Ko-fi produit, notes commande)

src/
├── App.js                  # Routage (login → dashboard), popups globaux commande/produit (jamais de changement d'onglet)
├── api/
│   ├── client.js            # Wrapper fetch (JWT Supabase, gestion des erreurs)
│   └── supabaseClient.js    # Client Supabase côté navigateur (clé publishable, auth uniquement)
├── hooks/                  # useOrders, useProducts, useCustomers (fetch + mutations)
├── components/
│   ├── ui/                 # Card, Button, Badge, ChannelBadge, ProductThumbnail
│   ├── layout/              # Sidebar (menu mobile + menu utilisateur), Header, NotificationBell
│   ├── auth/Login.js        # Écran de connexion / inscription (Supabase Auth)
│   ├── settings/             # Réglages : compte, source Ko-fi, import d'historique
│   ├── dashboard/           # Dashboard + répartition par canal
│   ├── orders/               # Liste des commandes, formulaire de saisie, détail cliquable
│   ├── products/             # Catalogue produits (tri, édition)
│   ├── customers/            # Page Clients (liste, édition)
│   └── reports/               # Rapports : aperçu, classement clients, classement produits
├── utils/                    # parseCsv, normalizeKofiCsv, computeReportStats, computeSoldByName
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
Depuis l'interface : bouton "Nouveau Produit" sur la page Produits. Ils se créent aussi automatiquement à chaque vente boutique Ko-fi (nom de l'article, catégorie "Ko-fi", prix à 0€ à compléter toi-même — Ko-fi ne fournit pas de prix unitaire fiable). Les produits vivent dans Supabase, propres à chaque compte (`user_id`) ; pas de gestion de stock, seule la quantité vendue (calculée depuis les commandes) est affichée.

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

### Déjà fait
- [x] Multi-utilisateur (Supabase Auth) + isolation des données
- [x] Intégration webhook Ko-fi + import CSV réutilisable
- [x] Catalogue produits enrichi automatiquement (nom, photo quand disponible)
- [x] Page Clients avec fiches persistées
- [x] Rapports et analyses avec graphiques (Recharts), liés aux vraies fiches client/produit
- [x] Notifications (activité récente)
- [x] Responsive mobile (sidebar en menu coulissant)
- [x] Dashboard cliquable avec graphiques et mois navigable
- [x] Recherche/auto-complétion clients et produits dans le formulaire de commande, avec création automatique

### À venir
- [ ] Export des données (CSV/PDF)
- [ ] Intégration expéditions La Poste
- [ ] Mode sombre/clair
- [ ] Gestion multi-devises
- [ ] Nouveaux canaux de vente

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