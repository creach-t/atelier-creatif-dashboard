# 🛒 Sources de vente et images produit — décisions

Document de décision (octobre 2026) : le registre de sources, ce que chaque plateforme permet **réellement**, et la stratégie d'images des produits.

## 1. Le registre de sources

Avant : le canal d'une commande (`kofi`, `reel`) était écrit en dur à une dizaine d'endroits (constantes, validation API, contrainte SQL, badges, formulaire, filtres, widgets).
Maintenant : **une entrée par source** dans [`src/domain/sources.js`](../src/domain/sources.js), consommée partout.

| Champ | Rôle |
|---|---|
| `id` | identifiant stocké dans `orders.channel` (minuscules, 2 à 32 caractères : `^[a-z][a-z0-9_]{1,31}$`) |
| `label`, `color`, `icon` | affichage (badge, tuile, légende, couleur des graphiques) ; les classes Tailwind sont écrites en toutes lettres dans `ui/ChannelBadge.js` |
| `kind` | `webhook` (la plateforme pousse les ventes : Ko-fi), `import` (export CSV officiel), `manual` (saisie) |
| `commission` | `{ mode: 'rate', defaultRate, label }` : la source prélève un % → c'est le `commission_rate` de la commande, **la même mécanique** que la commission boutique (revenus comptés en net). `{ mode: 'none' }` sinon |
| `defaultStatus` | statut d'une nouvelle commande (`delivered` pour un point de vente / marché : remise en main propre) |
| `enabledByDefault` | affichée dans le sélecteur de canal tant que l'utilisatrice ne l'a pas désactivée |
| `importAdapter` | id de l'adaptateur CSV dans `src/sources/` |

**Ajouter une source** : (1) une entrée dans `src/domain/sources.js`, (2) la même — `id`, `label`, `kind`, `defaultStatus`, `commission`, `importAdapter` — dans `api/lib/sources.js` (copie CommonJS ; `sourcesRegistry.test.js` échoue si elles divergent), (3) si elle s'importe : un adaptateur `src/sources/<source>.js` branché dans `src/sources/index.js`. Rien d'autre : sélecteur, filtres, widget « Canaux », rapports et Réglages se génèrent depuis le registre. La base n'a plus à changer (contrainte SQL large, migration `0012`).

**Réglages** (carte « Sources de vente ») : activer / désactiver une source, taux de frais proposé par défaut. Ces préférences vivent dans le navigateur (`utils/sourceSettings.js`, par compte) : ce sont des préférences d'affichage, pas des données de vente. Conséquence : elles ne suivent pas d'un appareil à l'autre (limite assumée ; le jour où ça gêne, une colonne `profiles.settings` suffira). **Désactiver une source ne masque jamais ses ventes** : un canal qui a des commandes reste dans les filtres et les graphiques.

**Frais de plateforme** : pas de second modèle. Le taux va dans `orders.commission_rate`, le net = total − frais (`utils/orderAmounts`). Le taux proposé est : le dernier utilisé pour cette source, sinon celui des Réglages, sinon celui du registre. Le taux d'Etsy (11 %) est **indicatif** (frais de transaction + paiement, hors frais fixes) : à ajuster.

## 2. Ce que chaque source permet — et ne permet pas

| Source | Intégration | Ce qui marche | Limites |
|---|---|---|---|
| **Ko-fi** | webhook + import CSV (existants, inchangés) | ventes en temps réel, historique | — |
| **Point de vente** | saisie | commission boutique en % | saisie manuelle |
| **Etsy** | **import CSV officiel** + saisie | « Articles vendus » (noms d'articles, regroupés par commande, livraison en « divers ») ou « Commandes vendues » (frais réels → taux) ; dédoublonnage par n° de commande Etsy (réimporter ne crée aucun doublon) | voir ci-dessous |
| **Vinted** | **saisie manuelle** | canal dédié, aucun frais vendeur | voir ci-dessous |
| Depop, Leboncoin, Marché / salon | saisie | canaux prêts (désactivés par défaut) | pas d'import |

**Etsy — API ou CSV ?** Etsy a une API officielle (Open API v3, OAuth 2). Elle demande une application déclarée et validée chez Etsy, un flux OAuth avec jetons à stocker côté serveur, et des appels planifiés : trop lourd et trop fragile pour un tableau de bord perso. **Choix : l'export CSV officiel** (Paramètres de la boutique → Options → Données téléchargeables). Si l'API devient souhaitée, les jetons resteraient côté serveur (variables d'env sur le VPS, jamais en CI) et alimenteraient le même import (`source_ref` = n° de commande).
⚠️ Les noms de colonnes de l'adaptateur suivent la documentation et des exports connus d'Etsy ; la correspondance est tolérante (casse, accents, alias) mais **n'a pas pu être vérifiée sur un export réel** : les fixtures de test sont inventées. Un fichier non reconnu est refusé avec un message, jamais deviné. Les remboursements / ajustements d'Etsy ne sont pas pris en compte.

**Vinted — pourquoi pas d'import ?** Vinted n'a **pas d'API publique** et ne propose pas d'export de ventes officiel. Récupérer les ventes impliquerait de scraper un compte ou de contourner des protections : exclu (et un mot de passe tiers ne serait de toute façon jamais stocké). **Choix : saisie manuelle** soignée (canal dédié, statut « en attente », client et articles autocomplétés).

Aucun jeton ni mot de passe tiers n'est stocké nulle part.

## 3. Images de produit

`products.image` contient **un emoji OU une URL https**. Validation unique (`api/lib/productImage.js`, copie `src/utils/productImage.js`, test de synchronisation) : https uniquement, 500 caractères max, pas d'identifiants dans l'URL, jamais `javascript:` / `data:` / `http:`. `kofi_url` est aussi limité à https (il est affiché en lien).

### Récupérer image, nom et prix depuis un lien Ko-fi
`POST /api/products/kofi-preview { url }` → `{ name, price, currency, imageUrl, kofi_url }`, **sans rien écrire** : le front compare, demande confirmation, puis passe par `POST` / `PATCH /products`.
- **Source : les balises Open Graph de la page publique** (`og:title`, `og:image`, `product:price:amount`), plus stables que l'API JSON interne de la boutique (`/shop/<pageId>/items/…`, qui reste utilisable en script manuel pour un rattrapage massif).
- **Anti-SSRF** : seul `https://ko-fi.com/s/<alias>` est accepté (hôte **exact**, pas de port, pas d'identifiants, alias `[A-Za-z0-9]{4,32}`) ; l'alias est extrait, l'URL **reconstruite** par le serveur — l'URL de l'utilisateur n'est jamais passée à `fetch`. Redirections refusées (`redirect: 'manual'`), délai 6 s, 512 Ko maximum lus, image acceptée seulement si elle est servie depuis `*.ko-fi.com`, limite de débit dédiée (90 / min), erreurs en codes stables sans détail réseau.
- **Cloudflare** : Ko-fi protège ses pages. **Constaté le 2026-10-01 depuis un poste de développement : le `fetch` de Node reçoit un défi (`403`, `cf-mitigated: challenge`)** alors qu'un navigateur ou `curl` passe. On **ne contourne pas** : la route répond `kofi_blocked`, le formulaire affiche un message clair et laisse coller l'adresse de l'image (ou envoyer un fichier) ; le rafraîchissement en masse s'arrête au premier refus. Selon l'IP du VPS, l'aperçu peut fonctionner ou non en production — non vérifiable d'ici.
- **Prix** : Ko-fi publie le prix dans la devise affichée ; un prix qui n'est pas en EUR n'est jamais appliqué d'office.

### Règles de non-écrasement (`features/products/kofiSyncPlan.js`, pures et testées)
Rien n'est écrasé en silence : chaque différence est une « modification proposée » avec une case.
- **Prix** : un prix non nul différent n'est jamais appliqué sans case cochée ; un prix à 0 est « manquant » (proposé, pré-coché) sauf produit marqué *gratuit*. Prix en autre devise : confirmation.
- **Image** : une photo existante n'est remplacée que sur confirmation ; un emoji ou le placeholder, librement.
- **Nom** : jamais modifié sur un produit existant (ses commandes le retrouvent par son nom) ; proposé seulement à la création.

### Fichier envoyé par l'utilisatrice : Supabase Storage vs simple URL
| | Stocker seulement des URL | Supabase Storage (retenu) |
|---|---|---|
| Mise en place | rien | bucket public `product-images` (migration `0013`) |
| Images « maison » (photo prise au téléphone) | impossible sans hébergement tiers | oui |
| Dépendance | liens tiers qui peuvent mourir | hébergées chez nous (Supabase) |
| Sécurité | `img-src https:` déjà ouvert | écritures **uniquement via l'API** (clé service role), type vérifié par octets d'en-tête, 1 Mo, redimensionnement client (800 px, JPEG) |

**Recommandation retenue : Storage pour les fichiers, URL pour le reste** (lien Ko-fi, URL collée, emoji). Sans la migration `0013`, tout fonctionne sauf l'envoi de fichier (`storage_unsupported`, le formulaire propose de coller l'URL).
**CSP** : `img-src 'self' data: https:` est **inchangée** et suffit pour Supabase Storage (https). La restreindre à une liste de domaines casserait le mode « coller l'URL d'une image » ; c'est une décision à valider (voir le message final).
Limite connue : une image remplacée n'est pas supprimée du bucket (volume négligeable ; nettoyage possible plus tard).
