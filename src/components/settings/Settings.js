import React from 'react';
import { AccountCard } from './AccountCard';
import { KofiSourceCard } from './KofiSourceCard';
import { ImportKofiHistory } from './ImportKofiHistory';
import { Card } from '../ui/Card';
import { ChannelLogo } from '../ui/ChannelBadge';
import { WorkspaceCard } from './WorkspaceCard';

export const Settings = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountCard />

      <WorkspaceCard />

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sources</h4>
        <div className="space-y-4">
          <KofiSourceCard />
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ChannelLogo channel="reel" size={20} className="text-pink-600" /> Point de vente
              </h3>
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-800">
                Toujours disponible
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Les ventes en boutique partenaire se saisissent manuellement (bouton « Nouvelle
              commande ») — aucune connexion à configurer.
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
