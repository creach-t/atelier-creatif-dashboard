// Authentification (Supabase Auth) : le seul endroit, avec api/, qui connaît le client Supabase.
// Les composants appellent ces fonctions et n'importent jamais le SDK.
import { supabase } from '../api/supabaseClient';
import { onUnauthorized } from '../api/client';

// Session courante, ou null.
export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// Écoute les connexions / déconnexions ; renvoie la fonction qui arrête l'écoute.
export const onSessionChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
};

// L'API a répondu 401 (session expirée ou révoquée) : on déconnecte. Renvoie la fonction qui arrête l'écoute.
export const signOutOnUnauthorized = () => onUnauthorized(() => signOut());

export const getCurrentEmail = async () => {
  const { data } = await supabase.auth.getUser();
  return (data && data.user && data.user.email) || '';
};

export const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signUp = async (email, password) => {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
};

export const signOut = () => supabase.auth.signOut();
