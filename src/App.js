import React, { useEffect, useState } from 'react';
import { AppShell } from './app/AppShell';
import { Login } from './features/auth/Login';
import { setUserScope } from './utils/userScope';
import { getSession, onSessionChange, signOutOnUnauthorized } from './services/authService';

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
    <p className="text-gray-500">Chargement...</p>
  </div>
);

const App = () => {
  const [session, setSession] = useState(undefined); // undefined = pas encore vérifié

  useEffect(() => {
    // Le compte connecté délimite le stockage du navigateur (voir utils/userScope) : à renseigner avant l'interface.
    const apply = (s) => {
      setUserScope(s && s.user ? s.user.id : '');
      setSession(s);
    };
    getSession().then(apply);
    return onSessionChange(apply);
  }, []);

  useEffect(() => signOutOnUnauthorized(), []);

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <Login />;
  return <AppShell />;
};

export default App;
