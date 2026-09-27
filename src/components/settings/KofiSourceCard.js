import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiClient } from '../../api/client';

const WEBHOOK_URL = `${window.location.origin}/api/kofi-webhook`;

export const KofiSourceCard = () => {
  const [loading, setLoading] = useState(true);
  const [connectedToken, setConnectedToken] = useState(null);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await apiClient.get('/profile');
      setConnectedToken(profile && profile.kofi_verification_token ? profile.kofi_verification_token : null);
      setToken(profile && profile.kofi_verification_token ? profile.kofi_verification_token : '');
    } catch (err) {
      setError(err.message || 'Impossible de charger ton profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // presse-papier indisponible, tant pis
    }
  };

  const handleSave = async () => {
    if (!token.trim()) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await apiClient.patch('/profile', { kofi_verification_token: token.trim() });
      setConnectedToken(updated.kofi_verification_token);
      setInfo('Ko-fi connecté.');
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Déconnecter Ko-fi ? Les prochaines commandes Ko-fi ne seront plus enregistrées jusqu\'à ce que tu reconnectes un token.')) {
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await apiClient.patch('/profile', { kofi_verification_token: null });
      setConnectedToken(null);
      setToken('');
      setInfo('Ko-fi déconnecté.');
    } catch (err) {
      setError(err.message || 'Impossible de déconnecter.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          💜 Ko-fi
        </h3>
        {!loading && (
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              connectedToken ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {connectedToken ? 'Connecté' : 'Non connecté'}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : (
        <>
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
            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Colle ton token ici"
                className="flex-1 px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                title={showToken ? 'Masquer' : 'Afficher'}
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {info && <p className="text-sm text-green-600 mb-4">{info}</p>}

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={!token.trim() || saving} size="sm">
              {saving ? 'Enregistrement...' : connectedToken ? 'Mettre à jour' : 'Connecter'}
            </Button>
            {connectedToken && (
              <Button variant="ghost" onClick={handleDisconnect} disabled={saving} size="sm">
                Déconnecter
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
