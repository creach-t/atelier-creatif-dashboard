import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, LogOut, User, ChevronUp, X, Plus } from 'lucide-react';
import { apiClient } from '../api/client';
import { supabase } from '../api/supabaseClient';
import { useWorkspace } from '../core/workspace/WorkspaceProvider';
import { pageIcon } from '../core/workspace/pageIcons';
import { spring } from '../core/ui/motion';

// Menu latéral : une entrée par page de l'espace de travail (donc personnalisable), puis Réglages.
export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { pages, page, isSettings, navigate, addPage } = useWorkspace();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setEmail((data && data.user && data.user.email) || '');
        const profile = await apiClient.get('/profile');
        setDisplayName((profile && profile.display_name) || '');
      } catch (err) {
        // silencieux — le menu retombe sur l'email/le placeholder
      }
    })();
  }, []);

  const go = (id) => {
    navigate(id);
    onCloseMobile && onCloseMobile();
  };

  const activeId = isSettings ? 'settings' : page && page.id;

  return (
    <>
      {mobileOpen && (
        <button type="button" className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onCloseMobile} aria-label="Fermer le menu" />
      )}
      <aside
        className={`w-64 bg-gradient-to-b from-purple-50 to-pink-50 border-r border-purple-100 h-screen flex flex-col
        fixed md:relative top-0 left-0 z-40 transition-transform duration-200 shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Cashly</h1>
            <p className="text-sm text-gray-600 mt-1">Gestion multi-canal</p>
          </div>
          <button onClick={onCloseMobile} className="md:hidden p-2 text-gray-500" aria-label="Fermer"><X size={20} /></button>
        </div>

        <nav className="mt-2 px-3 flex-1 min-h-0 overflow-y-auto scroll-soft" aria-label="Pages">
          {pages.map((p) => {
            const Icon = pageIcon(p.icon);
            const active = activeId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => go(p.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-3 mb-1.5 rounded-xl transition-colors ${active ? 'text-purple-700' : 'text-gray-600 hover:bg-white/50'}`}
              >
                {active && (
                  <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-xl bg-white shadow-sm border border-purple-100" />
                )}
                <Icon size={20} className="relative shrink-0" />
                <span className="relative font-medium truncate">{p.title}</span>
              </button>
            );
          })}
          <button
            onClick={() => { const created = addPage(); go(created.id); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-purple-600 hover:bg-white/60 border border-dashed border-purple-200 mt-2"
          >
            <Plus size={20} />
            <span className="font-medium">Nouvelle page</span>
          </button>
        </nav>

        <div className="p-3 shrink-0 relative">
          {menuOpen && (
            <>
              <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />
              <div className="relative z-20 bg-white rounded-xl border border-purple-100 shadow-lg mb-2 overflow-hidden">
                <button
                  onClick={() => { go('settings'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                >
                  <Settings size={16} /> Réglages
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-20 w-full bg-white rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{displayName || 'Créatrice'}</p>
                <p className="text-sm text-gray-600 truncate">{email}</p>
              </div>
              <ChevronUp size={16} className={`text-gray-400 shrink-0 transition-transform ${menuOpen ? '' : 'rotate-180'}`} />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
