import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { WorkspaceProvider, useWorkspace } from '../workspace/WorkspaceProvider';
import { DataProvider } from '../data/DataProvider';
import { OverlayProvider } from '../overlays/OverlayProvider';
import { Board } from '../workspace/Board';
import { WidgetPicker } from '../workspace/WidgetPicker';
import { PageSettings } from '../workspace/PageSettings';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Settings } from '../../components/settings/Settings';
import '../../widgets';

const Shell = () => {
  const { page, isSettings, addWidget } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  // Les panneaux de page (catalogue, réglages de page) se déclenchent depuis la barre du haut.
  const [picker, setPicker] = useState(false);
  const [pageSettings, setPageSettings] = useState(false);
  const mainRef = useRef(null);
  const routeKey = isSettings ? 'settings' : page.id;

  // <main> survit au changement de page : sans ça on arriverait au milieu de la page suivante.
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTop = 0; }, [routeKey]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
      <Sidebar mobileOpen={menuOpen} onCloseMobile={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onAddWidget={() => setPicker(true)} onPageSettings={() => setPageSettings(true)} />
        <main ref={mainRef} className="flex-1 overflow-auto pb-16 md:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            {isSettings ? <Settings key="settings" /> : <Board key={page.id} onAddWidget={() => setPicker(true)} />}
          </AnimatePresence>
        </main>
      </div>
      <BottomNav onOpenMenu={() => setMenuOpen(true)} />
      <WidgetPicker open={picker} onClose={() => setPicker(false)} onPick={addWidget} />
      <PageSettings open={pageSettings} onClose={() => setPageSettings(false)} />
    </div>
  );
};

// Tout ce qui est partagé par les widgets (données, fenêtres, espace de travail) est monté ici, une fois.
export const AppShell = () => (
  <MotionConfig reducedMotion="user">
    <DataProvider>
      <WorkspaceProvider>
        <OverlayProvider>
          <Shell />
        </OverlayProvider>
      </WorkspaceProvider>
    </DataProvider>
  </MotionConfig>
);
