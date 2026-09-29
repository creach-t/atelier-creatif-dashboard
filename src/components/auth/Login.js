import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../api/supabaseClient';

export const Login = () => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = () => {
    setMode(isSignup ? 'signin' : 'signup');
    setError(null);
    setInfo(null);
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (isSignup && password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-25 via-pink-25 to-blue-25 p-4">
      <Card className="p-5 sm:p-8 w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Cashly
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestion de ventes multi-canal pour créatifs</p>
        </div>

        <div className="flex bg-purple-50 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => mode !== 'signin' && switchMode()}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              !isSignup ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => mode !== 'signup' && switchMode()}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isSignup ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'
            }`}
          >
            Créer un compte
          </button>
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

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              className="w-full px-4 py-3 pr-11 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isSignup && (
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirme le mot de passe"
              className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <Button type="submit" className="w-full justify-center" disabled={submitting}>
            {submitting ? 'Patiente...' : isSignup ? 'Créer mon compte' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
