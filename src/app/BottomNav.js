import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useWorkspace } from '../core/workspace/WorkspaceProvider';
import { pageIcon } from '../core/workspace/pageIcons';
import { spring } from '../core/ui/motion';

const MAX_TABS = 4;

// Navigation du pouce sur mobile : les 4 premières pages + « Plus » qui ouvre le menu complet.
export const BottomNav = ({ onOpenMenu }) => {
  const { pages, page, isSettings, navigate } = useWorkspace();
  const tabs = pages.slice(0, MAX_TABS);
  const activeId = isSettings ? 'settings' : page && page.id;
  const overflowActive = activeId && !tabs.some((t) => t.id === activeId);

  return (
    <nav
      aria-label="Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-purple-100 flex pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((p) => {
        const Icon = pageIcon(p.icon);
        const active = activeId === p.id;
        return (
          <button
            key={p.id}
            onClick={() => navigate(p.id)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? 'text-purple-700' : 'text-gray-500'}`}
          >
            {active && <motion.span layoutId="bottom-pill" transition={spring} className="absolute top-0 h-0.5 w-8 rounded-full bg-purple-500" />}
            <Icon size={21} />
            <span className="truncate max-w-full px-1">{p.title}</span>
          </button>
        );
      })}
      <button
        onClick={onOpenMenu}
        className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${overflowActive ? 'text-purple-700' : 'text-gray-500'}`}
      >
        <Menu size={21} />
        Plus
      </button>
    </nav>
  );
};
