import { useCallback, useEffect, useState } from 'react';
import { readSourceSettings, writeSourceSettings, SOURCES_CHANGED } from '../utils/sourceSettings';

// Réglages des sources (actives, taux par défaut), partagés entre Réglages, le formulaire de commande et les widgets.
export function useSourceSettings() {
  const [settings, setSettings] = useState(readSourceSettings);

  useEffect(() => {
    const refresh = () => setSettings(readSourceSettings());
    window.addEventListener(SOURCES_CHANGED, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SOURCES_CHANGED, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const update = useCallback((change) => writeSourceSettings(change(readSourceSettings())), []);
  const setEnabled = useCallback((id, enabled) => update((s) => ({ ...s, enabled: { ...s.enabled, [id]: enabled } })), [update]);
  const setRate = useCallback((id, rate) => update((s) => ({ ...s, rates: { ...s.rates, [id]: rate } })), [update]);

  return { settings, setEnabled, setRate };
}
