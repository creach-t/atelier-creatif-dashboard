import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { apiClient } from '../../api/client';

const WEBHOOK_URL = `${window.location.origin}/api/kofi-webhook`;

export const ConnectKofi = ({ onDone, onSkip }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // presse-papier indisponible, tant pis — l'URL reste affichée et copiable à la main
    }
  };

  const handleSave = async () => {
    if (!token.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch('/profile', { kofi_verification_token: token.trim() });
      onDone();
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-8 w-full max-w-md">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Connecte ton Ko-fi</h2>
      <p className="text-sm text-gray-600 mb-4">
        Sur Ko-fi : Settings → API. Colle l'URL ci-dessous dans "Webhook URL", puis colle ton
        "Verification Token" ci-dessous.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">URL de webhook</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={WEBHOOK_URL}
            className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm bg-gray-50"
          />
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? 'Copié !' : 'Copier'}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Token (Ko-fi)</label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Colle ton token ici"
          className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={!token.trim() || saving} className="flex-1 justify-center">
          {saving ? 'Enregistrement...' : 'Enregistrer et continuer'}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="flex-1 justify-center">
          Passer
        </Button>
      </div>
    </Card>
  );
};
