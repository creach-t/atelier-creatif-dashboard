# 💸 Cashly

> **Dashboard de gestion de ventes multi-canal pour créatifs indépendants**

Une solution complète pour gérer efficacement vos commandes Ko-fi, vos ventes en point de vente (boutique partenaire), vos produits, vos clients et vos expéditions, le tout dans une interface moderne aux couleurs pastels.

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
- **Point de vente** : ventes physiques/personnalisées saisies manuellement
- D'autres canaux pourront être ajoutés par la suite (le canal est une donnée, pas du code en dur)

### ⚙️ **Réglages**
- Connexion/déconnexion Ko-fi (verification token, URL de webhook) à tout moment, pas juste à l'inscription
- Import de l'historique Ko-fi (CSV) réutilisable — corrige aussi les données déjà importées en cas de bug
- Édition du nom affiché

### 🧩 **Espace de travail modulaire**
Toute l'application est composée de **pages de widgets** que chacun organise à sa façon — pensé mobile d'abord, avec des animations discrètes (framer-motion, désactivées si le système demande de réduire les animations).
- **Cinq pages livrées** (Vue d'ensemble, Commandes, Produits, Clients, Rapports), entièrement recomposables : on peut créer, renommer, changer l'icône, réordonner, réinitialiser ou supprimer des pages
- **17 widgets** : indicateur (revenus, commandes, panier moyen, nouveaux clients, articles, en attente…), graphique (aires / courbe / barres, cumul), répartition par canal, produits les plus rentables ou vendus, commandes récentes, liste des commandes, calendrier d'activité, suivi des statuts, catalogue produits, liste des clients, meilleur·es client·es, jours de la semaine, 3 rapports détaillés, raccourcis, note libre. Le catalogue (« Ajouter ») montre un **aperçu réel** de chacun avec vos données
- **Verrouillé par défaut, déverrouillage par widget** : une icône de cadenas apparaît au survol (toujours visible sur écran tactile) ; elle autorise le glisser (poignée), le redimensionnement (coin) et un menu (réglages, dupliquer, supprimer) pour ce seul widget. Échap, ✓ ou un clic ailleurs le reverrouille. Annulation des dernières modifications
- **Réglages en direct** : chaque widget expose ses options (indicateur, période, forme, regroupement, nombre de lignes, filtres, couleur…) ; le panneau garde un **aperçu du widget épinglé en haut** pour toujours voir ce qu'on règle
- **Dispositions par taille d'écran** (bureau 12 colonnes, tablette 6, mobile 1) : réorganiser sur téléphone ne touche pas au bureau. Les widgets s'adaptent à **leur propre largeur** (container queries), en temps réel pendant qu'on les redimensionne
- **Filtre de période compact dans la barre du haut** (un seul contrôle avec flèches mois / année intégrées ; un tap ouvre un panneau : popover sur ordinateur, feuille sur mobile), suivi par tous les widgets réglés sur « Suivre la page » : mois navigable, 7/30/90 jours, **année navigable** (quand il existe d'autres années de commandes), tout, ou **plage de dates personnalisée**. Les revenus sont comptés **en net** (après commission de la boutique)
- **Sauvegarde** dans le navigateur, et synchronisée entre appareils via le profil (migration `0010`, optionnelle)
- Ouvrir une commande, un produit ou un client depuis n'importe quel widget affiche sa fiche en popup, sans changer de page
- Notifications (activité récente) accessibles depuis la cloche de la barre du haut

### 🛒 **Gestion des Commandes**
- **Calendrier d'activité** : une case carrée par jour, un seul violet qui fonce avec le nombre de commandes ; il remplit son widget (la hauteur fixe la taille des cases, la largeur le nombre de semaines, 3 mois / 6 mois / 1 an étant un minimum) ; un clic sur un jour ouvre ses commandes dans un panneau, sans toucher au calendrier
- Liste unique (une ligne par commande, à toutes les tailles d'écran) **triable en cliquant les en-têtes** de colonnes (client, date, canal, total) ; le statut n'est qu'une couleur d'accent sur le numéro de commande
- Filtrage par canal (logos Ko-fi / point de vente), période (7j/30j/année/tout) et recherche
- **Fiche en lecture seule** : rien ne se modifie avant de cliquer sur « Modifier la commande » (client, email, articles, divers, date, statut, suivi, notes, commission) ; seuls les champs réellement changés sont envoyés. Suppression possible après **double confirmation**
- Client **obligatoire**, saisi via une recherche dans le carnet existant — un nom sans correspondance devient un nouveau client ([`api/lib/customerSync.js`](api/lib/customerSync.js)) ; même principe pour les articles (un nouvel article crée un produit « Sans catégorie »)
- **Lignes « divers »** (frais de port, emballage, don, remise en montant négatif) : comptent dans le total mais ne créent aucun article ni produit, et ne sont jamais prises pour un don
- **Commission de la boutique** (point de vente), en % par commande, préremplie avec la dernière utilisée : le net perçu est calculé automatiquement
- Le **total est toujours calculé** (articles + divers), jamais saisi ; un écart d'une commande existante (don, prix libre, montant jamais détaillé) est conservé à part et retirable

### 🎯 **Catalogue Produits**
- Enrichi automatiquement à partir des ventes Ko-fi (nom, photo et lien Ko-fi direct quand disponibles dans la boutique)
- Pas de gestion de stock — la métrique qui compte est la **quantité vendue**, calculée depuis les commandes
- **Top 5 des produits les plus rentables depuis le début** en tête de page (widget « Produits les plus rentables », même podium partout)
- Cartes façon boutique Ko-fi (grande photo, placeholder sans photo) ou vue **Liste** ; tri par clic sur les en-têtes (liste) ou pastilles (grille), recherche, filtres catégorie et type
- **Variantes regroupées** : `Produit - Variant: X` (ou `(variant : X)`) forme une seule carte ; les ventes restent détaillées par variante dans la fiche (aucune fusion en base)
- **Physique / numérique** et **gratuit** explicites (0 € voulu ≠ prix manquant), modifiables dans le formulaire
- Fiche produit en deux étapes : une vue (photo, prix, ventes par variante), puis « Modifier » ; suppression après **double confirmation**

### 🧑‍🤝‍🧑 **Clients**
- Fiche client persistée en base (nom, email, notes), créée automatiquement à chaque nouvelle commande
- Fiche détaillée en popup : email, notes, badges (VIP/Fidèle/Généreux·se/Super fan), et tout l'historique de ses commandes — chacune cliquable pour ouvrir son détail
- Tri par clic sur les en-têtes (client, commandes, total dépensé, dernière commande), "Top 5 des client·es" en graphique

### 📈 **Rapports et Analyses**
- Évolution des revenus (graphique), répartition par canal, revenus par jour de la semaine
- Classement des clients (avec badges VIP/Fidèle/Généreux·se/Super fan) et des produits par quantité vendue — chaque ligne cliquable ouvre la vraie fiche (client/produit) en popup, sans quitter Rapports
- Période au choix (mois, année navigable, plage personnalisée) grâce au filtre de la barre du haut

### 💰 **Prix, gratuité et revenus**
- **Un prix connu prime toujours** : prix inscrit sur la ligne de commande, sinon prix du catalogue ; jamais écrasé par une déduction
- Un produit sans prix reçoit un **prix estimé** résolu sur *toutes* les commandes à la fois (moindres carrés robustes + vote de consensus, [`src/utils/estimatePrices.js`](src/utils/estimatePrices.js)) — prix libre, remises et paniers atypiques sont traités comme du bruit ; uniquement écrit en base quand il est « quasi sûr » (plusieurs commandes concordantes), et **toujours affiché différemment** (pastille en pointillés `≈`) d'un prix saisi, avec un bouton « Confirmer »
- **Revenus = net** : la commission de la boutique est déduite ; le « Total dépensé » d'un client reste en brut
- Le surplus au-delà des prix connus est un **don / prix libre** affiché à part, jamais réparti sur les produits

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
   - Dans l'éditeur SQL du projet, exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql) (installation neuve) — ça crée les tables `profiles`, `orders`, `products`, `customers`, le trigger qui crée un profil à chaque inscription, et les policies RLS. Pour une base existante, applique dans l'ordre les migrations de [`supabase/migrations/`](supabase/migrations) (`0002_multi_tenant.sql`, `0003_customers.sql`, `0004_products_kofi_link.sql`, `0005_orders_notes.sql`, `0006_products_price_estimated.sql`, `0007_products_free_kind.sql`, `0008_orders_commission_extras.sql`, `0009_orders_kofi_id_per_user.sql`, `0010_profiles_workspace.sql`, `0011_hardening.sql`).
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

Mobile d'abord : sous `md` (768px) la navigation passe en **barre du bas** (4 premières pages + « Plus » qui ouvre le menu complet), les panneaux deviennent des feuilles qui montent du bas (glissables pour fermer) et la grille de widgets tient sur **une colonne**.

Les widgets ne se basent **pas** sur la largeur de l'écran mais sur **la leur** : leur corps est un conteneur (`@container`), et leurs variantes CSS sont `@md:`, `@lg:`, `@xl:` (seuils 640 / 768 / 896 px de *widget*, voir `tailwind.config.js`). Un widget étroit sur un grand écran adopte donc la disposition compacte, et réagit en direct quand on le redimensionne. **N'utilisez pas** les variantes `sm:`/`md:`/`lg:` dans un widget.

**La hauteur compte aussi** : chaque widget reçoit sa taille mesurée en direct (`size` : largeur, hauteur et paliers `hTier` / `wTier` de `xs` à `lg`) et règle sa densité en conséquence — l'indicateur agrandit son chiffre jusqu'à remplir la place puis ajoute la période précédente et la courbe ; le graphique retire d'abord son total puis ses axes ; le podium devient une liste compacte quand il manque de hauteur ; les listes et le catalogue masquent filtres, tri puis recherche pour laisser la place aux lignes ; le calendrier garde des cases carrées et ajoute des semaines pour remplir sa largeur ; le suivi des statuts ne garde que ses compteurs ; le titre s'efface si le widget est très court. Ces paliers sont calculés dans [`useContainerSize`](src/core/widgets/useContainerSize.js).

**Aucun défilement dans un widget.** Deux mécanismes, dans [`src/core/widgets/`](src/core/widgets) :
- **Pagination** (`Fit.js` : `FitList`, `FitGrid`, `Paged`) pour les listes longues : le widget calcule combien de lignes (ou de cartes, en colonnes selon sa largeur) tiennent dans sa hauteur et répartit le reste en pages (« 1–8 sur 40 », points ou « 2 / 12 »). Agrandir le widget affiche plus de lignes par page. Les lignes ont une hauteur fixe pour que ce calcul soit exact. La barre d'outils (recherche, compteur, filtres, tri) fonctionne sur un **budget de hauteur** (`toolbarBudget`) : un élément n'apparaît que s'il reste de la place pour des lignes utiles.
- **Mise à l'échelle** (`ScaleToFit.js`) pour le contenu de taille fixe (compteurs, légende, rapports, raccourcis, calendrier) : s'il ne rentre pas, il est réduit pour tout montrer, jamais coupé ni scrollé. La note réduit sa police ; le calendrier, lui, ajuste ses cases (carrées) et son nombre de semaines à la place disponible.

| Zone | Largeur de la page | Grille |
|------|--------------------|--------|
| Mobile   | < 560px | 1 colonne, bas de page = barre de navigation |
| Tablette | 560px+  | 6 colonnes |
| Bureau   | 900px+  | 12 colonnes |

## 🛠️ Structure du Projet

> Le « pourquoi » (couches, règles de dépendance, flux de données, où ranger quoi) est dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Un prompt prêt à l'emploi pour un audit complet par Claude (via la base codebase-memory) est dans [`docs/AUDIT_PROMPT.md`](docs/AUDIT_PROMPT.md).

```
server.js                   # Serveur Express : sert l'API (routes ci-dessous) + le build React

api/                         # Routes API (montées par server.js)
├── lib/
│   ├── resource.js         # route({ GET, POST… }, { withId }) : auth + aiguillage + 405/404 ; listOwned / insertOwned / updateOwned / deleteOwned (toujours bornés à l'utilisateur)
│   ├── supabaseClient.js   # Client Supabase (clé secrète, côté serveur uniquement)
│   ├── auth.js             # Vérification du JWT de session Supabase Auth
│   ├── validate.js         # Validateurs de corps de requête (commande, UUID, bornes)
│   ├── errors.js           # serverError (500 générique, détail loggé), notFound, doublon
│   ├── dates.js            # Jours calendaires au fuseau Europe/Paris
│   ├── batch.js            # chunk : lots pour les requêtes groupées
│   ├── kofiMapper.js       # Traduction payload webhook Ko-fi -> commande
│   ├── productSync.js       # Auto-création de produits à partir des articles vendus (requêtes groupées)
│   └── customerSync.js       # Auto-création de fiches clients à partir des commandes (requêtes groupées)
├── kofi-webhook.js         # Réception des webhooks Ko-fi (résout le compte via profiles.kofi_verification_token)
├── orders.js                # GET (liste triée par order_date, filtre ?channel=) / POST — filtré par user_id
├── orders/[id].js           # PATCH (tous les champs, validés) / DELETE
├── orders/import.js          # POST — import/réimport de l'historique Ko-fi (CSV)
├── products.js               # GET / POST (dont is_free, kind) — filtré par user_id
├── products/[id].js          # PATCH / DELETE
├── customers.js               # GET / POST — filtré par user_id
├── customers/[id].js          # PATCH / DELETE
└── profile.js                 # GET / PATCH — display_name, kofi_verification_token, workspace (pages/widgets JSON, 200 Ko max)

Dockerfile                   # Build multi-stage : React puis image Node/Express de prod
docker-compose.prod.yml      # Service Docker + labels Traefik (cashly.creachtheo.fr)

supabase/
├── schema.sql              # Schéma complet (installation neuve, multi-utilisateur)
└── migrations/              # 0002 à 0011 — migrations additives (multi-tenant, clients, lien Ko-fi, notes, prix estimé, gratuit/type, commission/divers, id Ko-fi par utilisateur, espace de travail, durcissement RLS/index)

src/
├── App.js                  # Connexion, puis <AppShell />
├── app/                    # Composition de l'application : AppShell, Sidebar, BottomNav (mobile), Header (titre + période + actions)
├── core/                   # Moteur générique : ne dépend ni de features/, ni de app/, ni de widgets/ (règle ESLint no-restricted-imports)
│   ├── workspace/          # model.js (fonctions pures : pages, widgets, dispositions), WorkspaceProvider (état, annulation, sauvegarde),
│   │                       # Board (grille react-grid-layout), WidgetPicker, WidgetSettings, PageSettings, PeriodPicker, pageIcons, defaults.js, storage.js
│   ├── widgets/            # registry.js (defineWidget), WidgetFrame (cadre, verrou, barre d'outils), WidgetPreview, hooks (période/commandes), parts, common
│   ├── metrics/            # metrics.js (indicateurs), periods.js (mois/année/plage), series.js (séries temporelles), format.js (money, dates…)
│   ├── config/             # ConfigForm : formulaire de réglages généré depuis le schéma d'un widget
│   └── ui/                 # Sheet (panneau/feuille), AnimatedNumber, réglages d'animation
├── data/                   # DataProvider (commandes, produits, clients et dérivés partagés) + hooks de données (useResource, useOrders, useProducts, useCustomers, useEstimatedPrices, useAccount)
├── services/               # authService, profileService, importService : seuls (avec data/ et api/) à parler au serveur ou à Supabase — imposé par ESLint
├── domain/                 # constants.js : statuts, canaux, valeurs par défaut
├── ui/                     # Briques d'interface sans logique métier : Card, Button, Badge, ChannelBadge (vrais logos), ProductThumbnail/Cover, Modal, PriceTag, SortHeader
├── features/               # Une feuille par domaine métier (composants + logique de saisie)
│   ├── orders/             # OrderRow, OrdersHeatmap, NotificationBell, OrderForm (+ orderDraft.js, éditeurs), détail cliquable
│   ├── products/           # ProductCard, TopProducts, fiche, formulaire
│   ├── customers/          # Fiche client, formulaire
│   ├── reports/            # Vues détaillées des rapports (utilisées par les widgets « Rapport »)
│   ├── settings/           # Réglages : compte, source Ko-fi, import d'historique, personnalisation (réinitialisation)
│   ├── auth/Login.js       # Écran de connexion / inscription (Supabase Auth)
│   └── overlays/           # OverlayProvider : fiches et formulaires, ouverts depuis n'importe quel widget
├── widgets/                # 1 fichier = 1 widget (defineWidget) ; index.js les enregistre tous
├── api/
│   ├── client.js            # Wrapper fetch (JWT Supabase, gestion des erreurs)
│   └── supabaseClient.js    # Client Supabase côté navigateur (clé publishable, auth uniquement)
├── hooks/                  # useSort (tri par en-têtes), useIsNarrow
├── utils/                    # parseCsv, normalizeKofiCsv, computeReportStats, computeSoldByName, estimatePrices, computeProductRevenue, productVariants, productRanking, customerStats, orderAmounts (net/commission/divers)
├── __tests__/                # Jest : modèle de l'espace de travail, périodes/métriques/séries, prix, variantes, montants, Ko-fi…
├── index.js                 # Point d'entrée React
└── index.css                 # Styles Tailwind + grille de widgets

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

### Ajouter un widget (développeurs)
Un widget = un fichier dans [`src/widgets/`](src/widgets) qui appelle `defineWidget` (titre, icône, catégorie, taille par défaut, schéma de réglages, préréglages, composant), puis une ligne d'import dans `src/widgets/index.js`. Il apparaît alors tout seul dans le catalogue (avec aperçu), les réglages et la sauvegarde. Il lit ses données avec `useWidgetOrders(config.period)` / `useData()` et ouvre les fiches avec `useOverlays()`. Nouvel indicateur : une entrée dans `src/core/metrics/metrics.js`, disponible dans tous les widgets configurables.

### Ajouter des Produits
Depuis l'interface : bouton "Nouveau Produit" sur la page Produits. Ils se créent aussi automatiquement à chaque vente boutique Ko-fi (nom de l'article, catégorie "Ko-fi", prix à 0€ à compléter toi-même — Ko-fi ne fournit pas de prix unitaire fiable). Les produits vivent dans Supabase, propres à chaque compte (`user_id`) ; pas de gestion de stock, seule la quantité vendue (calculée depuis les commandes) est affichée.

### Personnaliser le Branding
1. Remplacez "Cashly" par votre nom dans [`src/app/Sidebar.js`](src/app/Sidebar.js), [`src/features/auth/Login.js`](src/features/auth/Login.js), `public/index.html` et `public/manifest.json`
2. Modifiez les gradients de couleur
3. Le logo est un symbole sans lettre (barres de ventes + étincelle), donc indépendant du nom : il vit dans [`src/ui/BrandMark.js`](src/ui/BrandMark.js) (écran de connexion, menu) et [`public/favicon.svg`](public/favicon.svg), deux fichiers à garder identiques si vous le redessinez

## 🔧 Scripts Disponibles

```bash
npm start          # Front seul (http://localhost:3000), sans backend
npm run server     # API Express seule (port 3000 par défaut, ou PORT=xxxx)
npm run dev        # Front + API ensemble, avec proxy /api -> API (dev complet)
npm run build      # Build production
npm test           # Tests unitaires (Jest, mode watch) — `npm test -- --watchAll=false` pour une exécution unique
npm run lint       # ESLint sur src/, api/ et server.js (inclut les règles de couches, voir docs/ARCHITECTURE.md)
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
- [x] Responsive mobile d'abord (barre de navigation du bas, feuilles, widgets adaptatifs)
- [x] Vue d'ensemble cliquable avec graphiques et mois navigable
- [x] Recherche/auto-complétion clients et produits dans le formulaire de commande, avec création automatique
- [x] Refonte de l'interface : podium des produits rentables, calendrier d'activité, cartes produit, tri par en-têtes, fiches en lecture seule, suppression avec double confirmation
- [x] Prix estimés par résolution globale des commandes, produits gratuits, physique/numérique, variantes regroupées
- [x] Commission de la boutique (revenus en net), lignes « divers », modification complète des commandes
- [x] Application modulaire en widgets : pages personnalisables, déverrouillage par widget, aperçus, filtre de période (année navigable, plage libre), sauvegarde synchronisée
- [x] Refonte d'architecture : couches `ui` / `features` / `data` / `services` / `core` avec garde-fous ESLint, helpers REST communs côté API, synchro produits/clients en requêtes groupées, formulaire de commande découpé et testé
- [x] Logo et favicon SVG, calendrier d'activité à cases carrées qui remplit son widget

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