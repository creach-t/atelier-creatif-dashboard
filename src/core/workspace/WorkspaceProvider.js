import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as ops from './model';
import { defaultWorkspace, defaultPages } from './defaults';
import { loadLocal, saveLocal, clearLocal, loadRemote, saveRemote } from './storage';
import { isKnownWidget } from '../widgets/registry';

const WorkspaceContext = createContext(null);
const HISTORY_LIMIT = 30;
const REMOTE_DEBOUNCE_MS = 1200;

const normalize = (raw) => ops.normalizeWorkspace(raw, { isKnownType: isKnownWidget });
const initialWorkspace = () => normalize(loadLocal()) || defaultWorkspace();
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const readHash = () => (window.location.hash || '').replace(/^#\/?/, '');

// État de l'espace de travail : pages + widgets, mode édition, historique d'annulation, page active
// (dans l'adresse, pour que le bouton retour du téléphone fonctionne) et sauvegarde locale + serveur.
export const WorkspaceProvider = ({ children }) => {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [past, setPast] = useState([]);
  const [routeId, setRouteId] = useState(readHash);
  const hydrated = useRef(false);
  const wsRef = useRef(workspace);
  wsRef.current = workspace;

  // Fusion avec la version serveur (autre appareil) : la plus récente gagne.
  useEffect(() => {
    let cancelled = false;
    loadRemote().then((remote) => {
      if (cancelled) return;
      const parsed = normalize(remote);
      if (parsed && parsed.updatedAt > wsRef.current.updatedAt) setWorkspace(parsed);
      hydrated.current = true;
    });
    return () => { cancelled = true; };
  }, []);

  // Sauvegarde : locale tout de suite, serveur en différé. Un espace jamais modifié (updatedAt 0) n'est pas
  // écrit : les futurs réglages par défaut de l'app continuent de s'appliquer à qui n'a rien personnalisé.
  useEffect(() => {
    if (!workspace.updatedAt) return undefined;
    saveLocal(workspace);
    if (!hydrated.current) return undefined;
    const t = setTimeout(() => saveRemote(workspace), REMOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [workspace]);

  useEffect(() => {
    const onHash = () => setRouteId(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const pastRef = useRef([]);
  const setHistory = (list) => { pastRef.current = list; setPast(list); };

  // Effets hors des updaters React : en StrictMode ceux-ci sont rejoués et empileraient l'historique deux fois.
  const commit = useCallback((fn) => {
    const prev = wsRef.current;
    const next = fn(prev);
    if (next === prev) return;
    wsRef.current = next;
    setHistory([...pastRef.current.slice(-(HISTORY_LIMIT - 1)), prev]);
    setWorkspace(next);
  }, []);

  const undo = useCallback(() => {
    const list = pastRef.current;
    if (list.length === 0) return;
    const restored = { ...list[list.length - 1], updatedAt: Date.now() };
    wsRef.current = restored;
    setHistory(list.slice(0, -1));
    setWorkspace(restored);
  }, []);

  const isSettings = routeId === 'settings';
  const page = workspace.pages.find((p) => p.id === routeId) || (isSettings ? null : workspace.pages[0]);

  const navigate = useCallback((id) => {
    window.location.hash = `/${id}`;
    setRouteId(id);
  }, []);

  const value = useMemo(() => {
    const pageId = page ? page.id : null;
    return {
      workspace,
      pages: workspace.pages,
      page,
      isSettings,
      navigate,
      canUndo: past.length > 0,
      undo,

      addWidget: (entry) => commit((ws) => ops.addWidget(ws, pageId, {
        type: entry.def.type,
        config: { ...entry.def.defaultConfig, ...entry.config },
        size: { w: entry.size.w, h: entry.size.h },
      })),
      removeWidget: (id) => commit((ws) => ops.removeWidget(ws, pageId, id)),
      duplicateWidget: (id) => commit((ws) => ops.duplicateWidget(ws, pageId, id)),
      updateConfig: (id, patch) => commit((ws) => ops.updateWidgetConfig(ws, pageId, id, patch)),
      resizeWidget: (id, bp, size) => commit((ws) => ops.resizeWidget(ws, pageId, id, bp, size)),
      // La grille notifie aussi à vide (montage) : on n'enregistre — et n'historise — que les vrais changements.
      applyLayouts: (layouts) => commit((ws) => {
        const current = ws.pages.find((p) => p.id === pageId);
        if (!current) return ws;
        const next = ops.applyLayouts(ws, pageId, layouts);
        const changed = !sameJson(next.pages.find((p) => p.id === pageId).layouts, current.layouts);
        return changed ? next : ws;
      }),

      setPagePeriod: (period) => commit((ws) => ops.updatePage(ws, pageId, { period, monthOffset: 0, yearOffset: 0 })),
      // Déplacement d'année : `min` = décalage le plus ancien permis (l'année de la plus vieille commande).
      shiftYear: (delta, min = -100) => commit((ws) => {
        const cur = ws.pages.find((p) => p.id === pageId);
        const offset = Math.max(min, Math.min(0, (cur.yearOffset || 0) + delta));
        return offset === (cur.yearOffset || 0) ? ws : ops.updatePage(ws, pageId, { yearOffset: offset });
      }),
      setCustomRange: (rangeFrom, rangeTo) => commit((ws) => ops.updatePage(ws, pageId, { period: 'custom', rangeFrom, rangeTo })),
      shiftMonth: (delta) => commit((ws) => {
        const cur = ws.pages.find((p) => p.id === pageId);
        const offset = Math.min(0, (cur.monthOffset || 0) + delta);
        return offset === (cur.monthOffset || 0) ? ws : ops.updatePage(ws, pageId, { monthOffset: offset });
      }),
      updatePage: (id, patch) => commit((ws) => ops.updatePage(ws, id, patch)),
      addPage: (title, icon) => {
        const created = ops.createPage({ title: title || 'Nouvelle page', icon: icon || 'layout', period: 'month' });
        commit((ws) => ops.addPage(ws, created));
        navigate(created.id);
        return created;
      },
      removePage: (id) => {
        commit((ws) => ops.removePage(ws, id));
        const remaining = workspace.pages.filter((p) => p.id !== id);
        if (id === pageId && remaining[0]) navigate(remaining[0].id);
      },
      movePage: (id, delta) => commit((ws) => ops.movePage(ws, id, delta)),
      // Remet une page comme à l'origine (si c'est une page livrée d'office) ou la vide (page créée par l'utilisatrice).
      resetPage: (id) => commit((ws) => {
        const original = defaultPages().find((p) => p.id === id);
        return ops.replacePage(ws, id, original || ops.createPage({ id, title: (ws.pages.find((p) => p.id === id) || {}).title || 'Page' }));
      }),
      resetWorkspace: () => {
        clearLocal();
        setHistory([]);
        const fresh = defaultWorkspace();
        wsRef.current = fresh;
        setWorkspace(fresh);
        // Le serveur garde l'ancienne version tant qu'on n'écrase pas : on la remplace par l'état neuf.
        saveRemote({ ...fresh, updatedAt: Date.now() });
        navigate(fresh.pages[0].id);
      },
    };
  }, [workspace, page, isSettings, past.length, navigate, commit, undo]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace doit être utilisé sous <WorkspaceProvider>');
  return ctx;
};
