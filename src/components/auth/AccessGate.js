import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { setAccessToken } from '../../api/client';

export const AccessGate = ({ onUnlock }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;

    setChecking(true);
    setError(null);
    setAccessToken(value.trim());

    try {
      await onUnlock();
    } catch (err) {
      setError('Clé d\'accès invalide.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
      <Card className="p-8 w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mb-4">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Atelier Créatif</h1>
          <p className="text-sm text-gray-600 mt-1">Entre ta clé d'accès pour ouvrir le dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Clé d'accès"
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full justify-center" disabled={checking}>
            {checking ? 'Vérification...' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
