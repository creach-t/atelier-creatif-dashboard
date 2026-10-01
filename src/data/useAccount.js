import { useEffect, useState } from 'react';
import { getCurrentEmail } from '../services/authService';
import { getProfile } from '../services/profileService';

// Email et nom affiché de l'utilisateur connecté (menu latéral, page Réglages).
// Chaque source est indépendante : si le profil échoue, l'email reste disponible (et inversement).
export function useAccount() {
  const [account, setAccount] = useState({ email: '', displayName: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getCurrentEmail(), getProfile()]).then(([emailResult, profileResult]) => {
      if (cancelled) return;
      setAccount({
        email: emailResult.status === 'fulfilled' ? emailResult.value : '',
        displayName: profileResult.status === 'fulfilled' ? (profileResult.value && profileResult.value.display_name) || '' : '',
      });
      const failure = [emailResult, profileResult].find((r) => r.status === 'rejected');
      if (failure) setError(failure.reason);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { ...account, loading, error };
}
