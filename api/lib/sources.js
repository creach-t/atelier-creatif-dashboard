// Copie CommonJS des sources de src/domain/sources.js (le serveur n'a pas de dossier commun avec le front).
// Seuls les champs utiles au serveur sont repris ; un test (sourcesRegistry.test.js) vérifie qu'ils restent synchronisés.
const SOURCES = [
  { id: 'kofi', label: 'Ko-fi', kind: 'webhook', defaultStatus: 'pending', commission: { mode: 'none', defaultRate: 0 }, importAdapter: 'kofi' },
  { id: 'reel', label: 'Point de vente', kind: 'manual', defaultStatus: 'delivered', commission: { mode: 'rate', defaultRate: 0 } },
  { id: 'etsy', label: 'Etsy', kind: 'import', defaultStatus: 'pending', commission: { mode: 'rate', defaultRate: 11 }, importAdapter: 'etsy' },
  { id: 'vinted', label: 'Vinted', kind: 'manual', defaultStatus: 'pending', commission: { mode: 'none', defaultRate: 0 } },
  { id: 'depop', label: 'Depop', kind: 'manual', defaultStatus: 'pending', commission: { mode: 'rate', defaultRate: 0 } },
  { id: 'leboncoin', label: 'Leboncoin', kind: 'manual', defaultStatus: 'pending', commission: { mode: 'none', defaultRate: 0 } },
  { id: 'marche', label: 'Marché / salon', kind: 'manual', defaultStatus: 'delivered', commission: { mode: 'none', defaultRate: 0 } },
];

const SOURCE_IDS = SOURCES.map((s) => s.id);

module.exports = { SOURCES, SOURCE_IDS };
