import React from 'react';
import { KofiSourceCard } from './KofiSourceCard';
import { ImportKofiHistory } from './ImportKofiHistory';
import { Card } from '../ui/Card';

export const Settings = () => {
  return (
    <div className="p-6 space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Réglages</h3>

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sources</h4>
        <div className="space-y-4">
          <KofiSourceCard />
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">🏪 Reel</h3>
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-800">
                Toujours disponible
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Les ventes en boutique partenaire se saisissent manuellement depuis l'onglet
              Commandes — aucune connexion à configurer.
            </p>
          </Card>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historique</h4>
        <ImportKofiHistory />
      </div>
    </div>
  );
};
