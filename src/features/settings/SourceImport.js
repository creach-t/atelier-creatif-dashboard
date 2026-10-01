import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { importSourceOrders } from '../../services/importService';
import { parseCsv } from '../../utils/parseCsv';
import { getImportAdapter } from '../../sources';
import { rateFor } from '../../utils/sourceSettings';
import { useSourceSettings } from '../../data/useSourceSettings';

// Import d'un export CSV officiel d'une source : lecture dans le navigateur (adaptateur de src/sources/), aperçu du
// nombre de commandes, puis envoi. Réimporter le même fichier ne crée aucun doublon (n° de commande de la source).
export const SourceImport = ({ source }) => {
  const adapter = getImportAdapter(source.id);
  const { settings } = useSourceSettings();
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

  if (!adapter) return null;

  const reset = () => { setParsed(null); setFileName(''); setError(null); setResult(null); };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    reset();
    setFileName(file.name);
    try {
      const out = adapter.parse(parseCsv(await file.text()), { defaultRate: rateFor(settings, source.id) });
      if (!out.recognized || out.rows.length === 0) {
        setError(`Aucune commande ${source.label} reconnue dans ce fichier : vérifie qu'il s'agit bien de l'export CSV indiqué ci-dessus.`);
        return;
      }
      setParsed(out);
    } catch (err) {
      setError('Impossible de lire ce fichier.');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      setResult(await importSourceOrders(source.id, parsed.rows));
    } catch (err) {
      setError(err.message === 'migration_0012_required'
        ? 'La migration 0012 n’a pas encore été exécutée dans Supabase : voir DEPLOYMENT.md.'
        : err.message || "Échec de l'import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-3">
      <p className="text-xs text-gray-600 mb-2">{adapter.help}</p>
      <input type="file" accept=".csv" onChange={handleFile} aria-label={`Fichier CSV ${source.label}`} className="text-sm block w-full max-w-full min-w-0" />

      {parsed && !result && (
        <p className="text-sm text-gray-700 mt-2">
          {parsed.rows.length} commande(s) détectée(s) dans {fileName}
          {parsed.unreadable > 0 ? ` (${parsed.unreadable} ligne(s) sans n° ou date lisible ignorée(s))` : ''}.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {result && (
        <p className="text-sm text-green-700 mt-2">
          {result.imported} commande(s) importée(s)
          {result.duplicates > 0 ? `, ${result.duplicates} déjà présente(s)` : ''}
          {result.invalid + result.invalid_date > 0 ? `, ${result.invalid + result.invalid_date} ignorée(s) (illisibles)` : ''}.
        </p>
      )}

      <div className="mt-2">
        {!result ? (
          <Button onClick={handleImport} disabled={!parsed || importing} size="sm">{importing ? 'Import…' : 'Importer'}</Button>
        ) : (
          <Button variant="secondary" onClick={reset} size="sm">Importer un autre fichier</Button>
        )}
      </div>
    </div>
  );
};
