// Copie CommonJS des sources de src/domain/sources.js (le serveur n'a pas de dossier commun avec le front).
// Seuls les champs utiles au serveur sont repris ; un test (sourcesRegistry.test.js) vérifie qu'ils restent synchronisés.
const SOURCES = [
  { id: 'kofi', kind: 'webhook', defaultStatus: 'pending', commission: { mode: 'none', defaultRate: 0 }, importAdapter: 'kofi' },
  { id: 'reel', kind: 'manual', defaultStatus: 'delivered', commission: { mode: 'rate', defaultRate: 0 } },
  { id: 'etsy', kind: 'import', defaultStatus: 'pending', commission: { mode: 'rate', defaultRate: 11 }, importAdapter: 'etsy' },
  { id: 'vinted', kind: 'manual', defaultStatus: 'pending', commission: { mode: 'none', defaultRate: 0 } },
  { id: 'depop', kind: 'manual', defaultStatus: 'pending', commission: { mode: 'rate', defaultRate: 0 } },
  { id: 'leboncoin', kind: 'manual', defaultStatus: 'pending', commission: { mode: 'none', defaultRate: 0 } },
  { id: 'marche', kind: 'manual', defaultStatus: 'delivered', commission: { mode: 'none', defaultRate: 0 } },
];

const SOURCE_IDS = SOURCES.map((s) => s.id);

module.exports = { SOURCES, SOURCE_IDS };
