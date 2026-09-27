import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../api/supabaseClient';

export const Login = () => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfo('Compte créé. Vérifie tes emails si une confirmation est demandée, sinon connecte-toi.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25">
      <Card className="p-8 w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center mb-4">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Cashly</h1>
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'signup' ? 'Crée ton compte' : 'Connecte-toi à ton dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
          <Button type="submit" className="w-full justify-center" disabled={submitting}>
            {submitting ? 'Patiente...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup');
            setError(null);
            setInfo(null);
          }}
          className="w-full text-center text-sm text-purple-600 mt-4 hover:underline"
        >
          {mode === 'signup' ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
        </button>
      </Card>
    </div>
  );
};
