# 🚀 Guide de Déploiement

Ce guide vous accompagne pour déployer votre Dashboard Atelier Créatif en production.

## 🎯 Options de Déploiement

### 1. 🟢 Vercel (Recommandé - Gratuit)

**Avantages :** Déploiement automatique, HTTPS gratuit, performances optimales

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Dans le dossier du projet
vercel

# 3. Suivre les instructions
# ✅ Link to existing project? No
# ✅ Project name: atelier-creatif-dashboard
# ✅ Directory: ./
# ✅ Build Command: npm run build
# ✅ Output Directory: build
```

**Configuration automatique :**
- Build: `npm run build`
- Output: `build/`
- Node.js: 18.x

### 2. 🔵 Netlify (Alternative gratuite)

```bash
# 1. Build local
npm run build

# 2. Drag & drop du dossier build/ sur netlify.com
# Ou connecter votre repo GitHub

# 3. Configuration :
# Build command: npm run build
# Publish directory: build
```

### 3. 🟠 Hébergement traditionnel

```bash
# 1. Build de production
npm run build

# 2. Upload du contenu de build/ via FTP
# 3. Pointer votre domaine vers le dossier
```

## ⚙️ Configuration de Production

### Variables d'Environnement

Créez un fichier `.env.production` :

```bash
# API Ko-fi (optionnel)
REACT_APP_KOFI_TOKEN=your_kofi_token_here

# Analytics (optionnel)
REACT_APP_GA_TRACKING_ID=GA_TRACKING_ID

# URL de base pour les API
REACT_APP_API_BASE_URL=https://api.votre-domaine.com

# Mode de stockage
REACT_APP_STORAGE_MODE=localStorage # ou 'api'
```

### Optimisations de Build

Dans `package.json`, assurez-vous que les scripts sont optimaux :

```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build",
    "build:analyze": "npm run build && npx bundle-analyzer build/static/js/*.js"
  }
}
```

## 🔒 Sécurité & Performance

### Checklist Sécurité
- [ ] Variables sensibles dans `.env` (non commitées)
- [ ] HTTPS activé sur le domaine
- [ ] Content Security Policy configurée
- [ ] Pas de données sensibles en dur dans le code

### Optimisations Performance
- [ ] Images optimisées (WebP si possible)
- [ ] Code splitting activé (par défaut avec CRA)
- [ ] Service Worker pour mise en cache
- [ ] Compression gzip/brotli activée

## 🌐 Configuration Domaine

### Domaine Personnalisé sur Vercel

```bash
# 1. Dans le dashboard Vercel
# Settings > Domains > Add Domain

# 2. Configurer DNS chez votre registrar :
# Type: CNAME
# Name: www (ou @)
# Value: cname.vercel-dns.com
```

### SSL/HTTPS
- ✅ Automatique sur Vercel/Netlify
- ✅ Let's Encrypt gratuit
- ✅ Redirection HTTP → HTTPS

## 📊 Monitoring & Analytics

### Google Analytics (Optionnel)

1. **Installer la dépendance :**
```bash
npm install gtag
```

2. **Configuration dans `src/index.js` :**
```javascript
import { gtag } from 'gtag';

// Configuration GA
if (process.env.REACT_APP_GA_TRACKING_ID) {
  gtag('config', process.env.REACT_APP_GA_TRACKING_ID);
}
```

### Monitoring d'Erreurs

```bash
# Sentry (optionnel)
npm install @sentry/react

# Configuration basique
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## 🔄 Déploiement Continu

### GitHub Actions + Vercel

Le workflow `.github/workflows/ci-cd.yml` est déjà configuré !

**Secrets à ajouter dans GitHub :**
1. Repository Settings > Secrets and variables > Actions
2. Ajouter :
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Processus Automatisé
1. Push sur `main` → Build automatique
2. Tests passent → Déploiement auto
3. Preview sur pull requests
4. Rollback facile en cas de problème

## 📱 PWA (Progressive Web App)

### Activation du Service Worker

Dans `src/index.js` :
```javascript
// Activer le service worker pour mise en cache
import { register } from './serviceWorker';
register(); // Au lieu de unregister()
```

### Configuration Manifest

Le fichier `public/manifest.json` est déjà configuré pour PWA !

**Fonctionnalités PWA :**
- ✅ Installation sur mobile/desktop
- ✅ Fonctionnement hors-ligne
- ✅ Notifications push (future)
- ✅ Icônes adaptatives

## 🐛 Debugging Production

### Logs d'Erreur

```javascript
// Dans src/App.js
window.addEventListener('error', (e) => {
  console.error('Production Error:', e.error);
  // Envoyer à votre service de monitoring
});
```

### Mode Debug
```bash
# Build avec sourcemaps pour debug
GENERATE_SOURCEMAP=true npm run build
```

## 🎯 Checklist Final

### Avant Déploiement
- [ ] Tests passent (`npm test`)
- [ ] Build réussit (`npm run build`)
- [ ] Responsive testé sur mobile/tablet
- [ ] Performance vérifiée (Lighthouse)
- [ ] Liens et formulaires fonctionnels

### Après Déploiement
- [ ] Site accessible via le domaine
- [ ] HTTPS fonctionne
- [ ] Toutes les pages se chargent
- [ ] Données localStorage persistent
- [ ] Pas d'erreurs console

### Monitoring
- [ ] Analytics configuré
- [ ] Monitoring d'erreurs actif
- [ ] Alertes déploiement configurées
- [ ] Backup des données important

## 🆘 Dépannage

### Erreurs Communes

**Build échoue :**
```bash
# Nettoyer le cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Page blanche après déploiement :**
- Vérifier `"homepage"` dans `package.json`
- Contrôler les chemins relatifs
- Vérifier la console pour erreurs JS

**localStorage non persistant :**
- Vérifier les permissions cookies
- Tester en navigation privée
- Implémenter fallback API

---

🎉 **Votre dashboard est maintenant en production !** 

Pour toute question, consultez la [documentation](README.md) ou ouvrez une [issue](https://github.com/creach-t/atelier-creatif-dashboard/issues).