import React from 'react';
import { AccountCard } from './AccountCard';
import { KofiSourceCard } from './KofiSourceCard';
import { ImportKofiHistory } from './ImportKofiHistory';
import { SourcesCard } from './SourcesCard';
import { WorkspaceCard } from './WorkspaceCard';
import { CatalogRefreshCard } from './CatalogRefreshCard';

export const Settings = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountCard />

      <WorkspaceCard />

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sources</h4>
        <div className="space-y-4">
          <KofiSourceCard />
          <SourcesCard />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historique</h4>
        <ImportKofiHistory />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Catalogue</h4>
        <CatalogRefreshCard />
      </div>
    </div>
  );
};
