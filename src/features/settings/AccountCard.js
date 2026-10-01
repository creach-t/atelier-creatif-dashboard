import React, { useEffect, useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useAccount } from '../../data/useAccount';
import { saveDisplayName } from '../../services/profileService';

export const AccountCard = () => {
  const account = useAccount();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [info, setInfo] = useState(null);
  const { loading, email } = account;
  const error = saveError || (account.error && (account.error.message || 'Impossible de charger ton compte.'));

  // Le champ est modifiable : on le remplit une fois, quand le nom enregistré arrive.
  useEffect(() => { setDisplayName(account.displayName); }, [account.displayName]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setInfo(null);
    try {
      await saveDisplayName(displayName);
      setInfo('Enregistré.');
    } catch (err) {
      setSaveError(err.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mon compte</h3>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              readOnly
              value={email}
              className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom affiché</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ton nom ou pseudo"
              className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {info && <p className="text-sm text-green-600 mb-4">{info}</p>}

          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </>
      )}
    </Card>
  );
};
