# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer au Dashboard Atelier Créatif ! Ce guide vous aidera à bien commencer.

## 🚀 Avant de Commencer

### Prérequis
- Node.js 16+ installé
- Git configuré sur votre machine
- Un compte GitHub

### Configuration de l'environnement
```bash
# Fork le repository sur GitHub
# Cloner votre fork
git clone https://github.com/[votre-username]/atelier-creatif-dashboard.git
cd atelier-creatif-dashboard

# Installer les dépendances
npm install

# Démarrer en mode développement (front seul, sans backend)
npm start
```

> Pour travailler sur le webhook Ko-fi ou les routes `/api/*`, il faut le backend (Supabase + `vercel dev`) : voir la section [Configuration du backend](README.md#configuration-du-backend-supabase--ko-fi) du README.

## 📋 Types de Contributions

### 🐛 Rapport de Bugs
- Utilisez les [GitHub Issues](https://github.com/creach-t/atelier-creatif-dashboard/issues)
- Décrivez le problème en détail
- Incluez les étapes pour reproduire
- Mentionnez votre environnement (OS, navigateur, version Node.js)

### ✨ Nouvelles Fonctionnalités
- Ouvrez d'abord une issue pour discuter de l'idée
- Attendez l'approbation avant de commencer le développement
- Suivez les standards de code existants

### 📝 Documentation
- Améliorations du README
- Commentaires dans le code
- Guides d'utilisation
- Exemples d'implémentation

## 🔄 Processus de Contribution

### 1. Créer une Branche
```bash
# Créer une branche depuis main
git checkout -b feature/nom-de-votre-feature
# ou
git checkout -b bugfix/description-du-bug
```

### 2. Conventions de Nommage

#### Branches
- `feature/nouvelle-fonctionnalite` - Nouvelles fonctionnalités
- `bugfix/correction-bug` - Corrections de bugs
- `hotfix/correction-urgente` - Corrections urgentes
- `docs/mise-a-jour-doc` - Documentation
- `refactor/amelioration-code` - Refactoring

#### Commits
Utilisez les [Conventional Commits](https://www.conventionalcommits.org/) :
```
feat: ajouter fonctionnalité de calcul des frais de port
fix: corriger l'affichage des commandes en attente
docs: mettre à jour le guide d'installation
style: améliorer l'espacement des cards
refactor: extraire la logique de mapping Ko-fi dans un module dédié
```

Types de commits :
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation
- `style` - Changements de style/formatting
- `refactor` - Refactoring de code
- `test` - Ajout/modification de tests
- `chore` - Maintenance

### 3. Standards de Code

#### React/JavaScript
```javascript
// ✅ Bon
const MyComponent = ({ title, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const handleClick = useCallback(() => {
    onClick();
    setIsVisible(true);
  }, [onClick]);

  return (
    <div className="p-4 rounded-xl">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={handleClick}>Cliquer</Button>
    </div>
  );
};
```

#### CSS/Tailwind
```javascript
// ✅ Utilisez les classes Tailwind existantes
className="bg-white rounded-2xl shadow-sm border border-purple-100"

// ❌ Évitez les styles inline
style={{ backgroundColor: 'white', borderRadius: '16px' }}
```

### 4. Tests
```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage
```

### 5. Pull Request

#### Template de PR
```markdown
## 📝 Description
Brève description des changements

## 🎯 Type de Changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## ✅ Checklist
- [ ] Code testé localement
- [ ] Documentation mise à jour
- [ ] Changements responsive vérifiés
- [ ] Accessibilité respectée
```

#### Critères d'Acceptance
- [ ] Code review approuvé
- [ ] Tests passent
- [ ] Pas de conflits
- [ ] Documentation à jour
- [ ] Compatible mobile

## 🎨 Guidelines Design

### Palette de Couleurs
```css
/* Respectez la palette existante */
--purple-primary: #8b5cf6
--pink-primary: #f472b6
--purple-light: #faf7ff
--pink-light: #fdf2f8
```

### Composants
- Utilisez les composants existants (`Card`, `Button`, `Badge`)
- Maintenez la cohérence visuelle
- Respectez les espacements avec Tailwind

### Animations
- Privilégiez les transitions subtiles
- Utilisez `transition-all duration-200`
- Évitez les animations trop complexes

## 🔍 Code Review

### Pour les Reviewers
- Vérifiez la fonctionnalité
- Testez sur mobile
- Validez l'accessibilité
- Contrôlez la performance
- Respectez le style de code

### Pour les Contributors
- Répondez constructivement aux commentaires
- Effectuez les modifications demandées
- Testez après chaque changement
- Communiquez clairement

## 🏗️ Roadmap Contributeur

### Issues pour Débutants
Cherchez le label `good-first-issue` :
- Corrections de typos
- Améliorations CSS mineures
- Ajout de tests simples
- Documentation

### Issues Intermédiaires
- Nouveaux composants
- Intégrations API
- Optimisations performance
- Fonctionnalités métier

### Issues Avancées
- Architecture majeure
- Intégrations complexes
- Migrations de données
- Sécurité

## 📞 Support

### Questions ?
- [GitHub Discussions](https://github.com/creach-t/atelier-creatif-dashboard/discussions)
- [Issues](https://github.com/creach-t/atelier-creatif-dashboard/issues)

### Communauté
- Respectez le [Code of Conduct](CODE_OF_CONDUCT.md)
- Soyez bienveillant et constructif
- Aidez les nouveaux contributeurs

## 🎉 Reconnaissance

Les contributeurs sont mis en avant dans :
- [README.md](README.md)
- [Release notes](https://github.com/creach-t/atelier-creatif-dashboard/releases)
- Page "Contributors" du repository

---

**Merci de contribuer à rendre ce dashboard encore meilleur ! 💜**