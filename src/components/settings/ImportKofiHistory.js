import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { apiClient } from '../../api/client';
import { parseCsv } from '../../utils/parseCsv';
import { normalizeKofiCsvRows } from '../../utils/normalizeKofiCsv';

export const ImportKofiHistory = () => {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setRows(null);
    setFileName('');
    setError(null);
    setResult(null);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);
    setRows(null);

    try {
      const text = await file.text();
      const normalized = normalizeKofiCsvRows(parseCsv(text));

      if (normalized.length === 0) {
        setError(
          "Aucune transaction reconnue dans ce fichier — le format ne correspond peut-être pas à ce qui est attendu, dis-le-moi et on ajuste."
        );
        return;
      }

      setRows(normalized);
    } catch (err) {
      setError('Impossible de lire ce fichier.');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await apiClient.post('/orders/import', { rows });
      setResult(res);
    } catch (err) {
      setError(err.message || "Échec de l'import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Importer l'historique Ko-fi</h3>
      <p className="text-sm text-gray-600 mb-4">
        Sur Ko-fi : More → Transactions → Download CSV. Le webhook ne rattrape pas les ventes
        passées — cet import comble le trou. Réimporter le même fichier corrige les commandes déjà
        importées au lieu d'en créer des doublons.
      </p>

      <input type="file" accept=".csv" onChange={handleFile} className="mb-4 text-sm block w-full max-w-full min-w-0" />

      {fileName && rows && !result && (
        <p className="text-sm text-gray-700 mb-4">
          {rows.length} transaction(s) détectée(s) dans {fileName}
          {rows.some((r) => r.isOutgoing)
            ? ` (dont ${rows.filter((r) => r.isOutgoing).length} paiement(s) sortant(s) ignoré(s) — abonnements ou achats sur ta propre boutique)`
            : ''}
          .
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {result && (
        <p className="text-sm text-green-600 mb-4">
          {result.imported} commande(s) importée(s)/mise(s) à jour
          {result.skipped > 0 ? `, ${result.skipped} ligne(s) ignorée(s)` : ''}.
        </p>
      )}

      <div className="flex gap-3">
        {!result ? (
          <Button onClick={handleImport} disabled={!rows || importing} size="sm">
            {importing ? 'Import...' : 'Importer'}
          </Button>
        ) : (
          <Button variant="secondary" onClick={reset} size="sm">
            Importer un autre fichier
          </Button>
        )}
      </div>
    </Card>
  );
};
