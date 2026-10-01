import React from 'react';
import { Card } from '../../ui/Card';
import { ChannelLogo, channelStyle } from '../../ui/ChannelBadge';
import { SOURCES } from '../../domain/sources';
import { isSourceEnabled, rateFor } from '../../utils/sourceSettings';
import { useSourceSettings } from '../../data/useSourceSettings';
import { SourceImport } from './SourceImport';

const KIND_LABELS = {
  webhook: 'Automatique (webhook)',
  import: 'Import CSV + saisie',
  manual: 'Saisie manuelle',
};

const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-purple-500' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
  </button>
);

// Une ligne par source du registre : activer / désactiver (sélecteur de canal, filtres), taux de frais proposé
// par défaut, et l'import CSV quand la source en a un. Désactiver une source ne supprime ni ne masque ses ventes.
export const SourcesCard = () => {
  const { settings, setEnabled, setRate } = useSourceSettings();

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900">Sources de vente</h3>
      <p className="text-sm text-gray-600 mt-1 mb-4">
        Active les canaux que tu utilises : ils apparaissent dans « Nouvelle commande » et les filtres. Le taux de frais est
        proposé à chaque nouvelle vente de la source (il reste modifiable commande par commande).
      </p>

      <ul className="divide-y divide-purple-100">
        {SOURCES.map((source) => {
          const enabled = isSourceEnabled(settings, source.id);
          const rate = rateFor(settings, source.id);
          return (
            <li key={source.id} className="py-3">
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${channelStyle(source.id).tile}`}>
                  <ChannelLogo channel={source.id} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{source.label}</p>
                  <p className="text-xs text-gray-500 truncate">{KIND_LABELS[source.kind]}</p>
                </div>
                <Switch checked={enabled} onChange={(on) => setEnabled(source.id, on)} label={`${enabled ? 'Désactiver' : 'Activer'} ${source.label}`} />
              </div>

              {enabled && source.commission.mode === 'rate' && (
                <label className="flex items-center gap-2 mt-2 ml-12 text-sm text-gray-700">
                  <span className="flex-1 min-w-0">{source.commission.label || 'Frais'} par défaut</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.rates[source.id] ?? rate}
                    onChange={(e) => setRate(source.id, e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-2 py-1.5 border border-purple-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <span className="text-gray-500">%</span>
                </label>
              )}

              {enabled && source.importAdapter && source.importAdapter !== 'kofi' && (
                <div className="mt-3 ml-12">
                  <SourceImport source={source} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
