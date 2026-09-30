import React, { useEffect, useState } from 'react';
import { AppShell } from './core/shell/AppShell';
import { Login } from './components/auth/Login';
import { onUnauthorized } from './api/client';
import { supabase } from './api/supabaseClient';

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
    <p className="text-gray-500">Chargement...</p>
  </div>
);

const App = () => {
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => onUnauthorized(() => supabase.auth.signOut()), []);

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Login />;
  return <AppShell />;
};

export default App;
