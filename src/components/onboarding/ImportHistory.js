import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { apiClient } from '../../api/client';
import { parseCsv } from '../../utils/parseCsv';
import { normalizeKofiCsvRows } from '../../utils/normalizeKofiCsv';

export const ImportHistory = ({ onDone, onSkip }) => {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);

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
      const withId = normalized.filter((r) => r.transaction_id);

      if (withId.length === 0) {
        setError(
          'Aucune colonne "Transaction ID" reconnue dans ce fichier — le format ne correspond peut-être pas à ce qui est attendu, dis-le-moi et on ajuste.'
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
    <Card className="p-8 w-full max-w-md">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Importe ton historique Ko-fi</h2>
      <p className="text-sm text-gray-600 mb-4">
        Sur Ko-fi : More → Transactions → Download CSV. Le webhook ne rattrape pas les ventes
        passées — cet import comble le trou une bonne fois pour toutes.
      </p>

      <input type="file" accept=".csv" onChange={handleFile} className="mb-4 text-sm" />

      {fileName && rows && !result && (
        <p className="text-sm text-gray-700 mb-4">
          {rows.length} ligne(s) détectée(s) dans {fileName}.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {result && (
        <p className="text-sm text-green-600 mb-4">
          {result.imported} commande(s) importée(s)
          {result.skipped > 0 ? `, ${result.skipped} ligne(s) ignorée(s) (sans transaction ID)` : ''}.
        </p>
      )}

      <div className="flex gap-3">
        {!result ? (
          <>
            <Button onClick={handleImport} disabled={!rows || importing} className="flex-1 justify-center">
              {importing ? 'Import...' : 'Importer'}
            </Button>
            <Button variant="ghost" onClick={onSkip} className="flex-1 justify-center">
              Passer
            </Button>
          </>
        ) : (
          <Button onClick={onDone} className="flex-1 justify-center">
            Continuer
          </Button>
        )}
      </div>
    </Card>
  );
};
