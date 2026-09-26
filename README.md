# 🎨 Atelier Créatif - Dashboard de Gestion

> **Dashboard élégant et intuitif pour illustratrices indépendantes**

Une solution complète pour gérer efficacement vos commandes Ko-fi, vos produits créatifs et vos expéditions, le tout dans une interface moderne aux couleurs pastels.

![Dashboard Preview](https://img.shields.io/badge/Version-1.0.0-purple)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.3.2-teal)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Fonctionnalités

### 🌐 **Multi-canal**
- **Ko-fi** : commandes/paiements synchronisés automatiquement via webhook
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

Les commandes Ko-fi arrivent via un webhook, et les ventes Reel sont saisies manuellement : les deux ont besoin d'un stockage partagé. Ce projet utilise des **fonctions serverless Vercel** (`/api`) + **Supabase** (Postgres géré) pour ça.

1. **Créer le projet Supabase**
   - Sur [app.supabase.com](https://app.supabase.com), crée un nouveau projet.
   - Dans l'éditeur SQL du projet, exécute le contenu de [`supabase/schema.sql`](supabase/schema.sql) — ça crée les tables `orders` et `products`, et insère les produits de démonstration.
   - Dans *Project Settings → API*, récupère l'**URL du projet** et la **clé `service_role`** (⚠️ pas la clé `anon`, celle-ci reste secrète côté serveur uniquement).

2. **Configurer le webhook Ko-fi**
   - Sur Ko-fi, va dans *Settings → API* pour récupérer ton **verification token**.
   - Une fois le projet déployé (voir [DEPLOYMENT.md](DEPLOYMENT.md)), configure l'URL de webhook Ko-fi sur `https://<ton-domaine>/api/kofi-webhook`.

3. **Variables d'environnement**
   - Copie `.env.example` vers `.env.local` (déjà ignoré par git) et remplis :
     - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
     - `KOFI_VERIFICATION_TOKEN`
     - `DASHBOARD_ACCESS_TOKEN` : une clé que tu choisis toi-même, elle protège l'accès au dashboard et aux données clients (à saisir une fois dans l'écran de connexion du dashboard).
   - En production, définis les mêmes variables dans Vercel (*Project Settings → Environment Variables*).

### Démarrer en développement

```bash
# Lance le front ET les fonctions /api ensemble (nécessaire pour tester le webhook et les données)
npm run dev
```

`npm run dev` utilise `vercel dev` (via `npx`) : la première exécution peut te demander de te connecter à Vercel et de lier le projet — un test complet de bout en bout (webhook → Supabase → dashboard) nécessite ça. Pour ne travailler que sur l'UI sans backend, `npm start` reste disponible mais les appels `/api/*` échoueront.

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
api/                        # Fonctions serverless Vercel (backend)
├── lib/
│   ├── supabaseClient.js   # Client Supabase (clé service_role, côté serveur uniquement)
│   ├── auth.js             # Vérification du token d'accès dashboard
│   └── kofiMapper.js       # Traduction payload Ko-fi -> commande
├── kofi-webhook.js         # Réception des webhooks Ko-fi
├── orders.js                # GET (liste, filtre ?channel=) / POST (création manuelle)
├── orders/[id].js           # PATCH (statut, tracking)
├── products.js               # GET / POST
└── products/[id].js          # PATCH / DELETE

supabase/
└── schema.sql              # Schéma des tables orders/products à exécuter sur Supabase

src/
├── App.js                  # Assemblage (auth, routing des sections)
├── api/client.js           # Wrapper fetch (auth, gestion des erreurs)
├── hooks/                  # useOrders, useProducts (fetch + mutations)
├── components/
│   ├── ui/                 # Card, Button, Badge, ChannelBadge
│   ├── layout/              # Sidebar, Header
│   ├── auth/AccessGate.js  # Écran de connexion (token dashboard)
│   ├── dashboard/           # Dashboard + répartition par canal
│   ├── orders/               # Liste des commandes + formulaire de saisie
│   └── products/             # Catalogue produits
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
Les produits vivent maintenant dans Supabase, pas dans le code. Ajoute une ligne dans la table `products` (via l'éditeur Supabase, ou `POST /api/products` avec ton token d'accès en `Authorization: Bearer ...`).

### Personnaliser le Branding
1. Remplacez "Atelier Créatif" par votre nom
2. Modifiez les gradients de couleur
3. Ajoutez votre logo dans la sidebar

## 🔧 Scripts Disponibles

```bash
npm start          # Développement (http://localhost:3000)
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
- **Vercel** pour l'hébergement

---

<div align="center">
  <p>Fait avec 💜 pour les créatifs</p>
  <p>⭐ Star ce repo si il vous a aidé !</p>
</div>