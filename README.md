# 🎨 Atelier Créatif - Dashboard de Gestion

> **Dashboard élégant et intuitif pour illustratrices indépendantes**

Une solution complète pour gérer efficacement vos commandes Ko-fi, vos produits créatifs et vos expéditions, le tout dans une interface moderne aux couleurs pastels.

![Dashboard Preview](https://img.shields.io/badge/Version-1.0.0-purple)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.3.2-teal)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Fonctionnalités

### 📊 **Dashboard Principal**
- Vue d'ensemble avec métriques visuelles
- Revenus total, commandes en attente, alertes stock
- Commandes récentes et produits populaires
- Interface responsive et accessible

### 🛒 **Gestion des Commandes**
- Ajout, modification et suivi des commandes
- Filtrage par statut et recherche avancée
- Gestion des statuts (En attente → Expédiée → Livrée)
- Interface tableau claire et intuitive

### 🎯 **Catalogue Produits**
- Gestion complète du stock
- Alertes stock faible automatiques
- Catégorisation et recherche
- Interface grille responsive

### 📦 **Modules Futurs**
- Intégration expéditions La Poste
- Rapports et analyses détaillées
- Synchronisation Ko-fi automatique

## 🚀 Installation Rapide

### Prérequis
- Node.js 16+ 
- npm ou yarn

### Étapes d'installation

```bash
# 1. Cloner le repository
git clone https://github.com/creach-t/atelier-creatif-dashboard.git
cd atelier-creatif-dashboard

# 2. Installer les dépendances
npm install

# 3. Démarrer en mode développement
npm start
```

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
src/
├── App.js              # Composant principal
├── index.js            # Point d'entrée React
├── index.css           # Styles Tailwind + custom
└── reportWebVitals.js  # Monitoring performances

public/
├── index.html          # Template HTML
├── manifest.json       # PWA config
└── favicon.ico         # Icône

config/
├── tailwind.config.js  # Configuration Tailwind
├── postcss.config.js   # PostCSS setup
└── package.json        # Dépendances NPM
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
```javascript
// src/App.js - Modifier initialProducts
{
  id: '4',
  name: 'Nouveau Produit',
  category: 'Votre Catégorie',
  price: 12.50,
  stock: 15,
  image: '🎨'
}
```

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