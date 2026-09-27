import { supabase } from './supabaseClient';

const unauthorizedListeners = new Set();

export function onUnauthorized(callback) {
  unauthorizedListeners.add(callback);
  return () => unauthorizedListeners.delete(callback);
}

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data && data.session && data.session.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const authHeader = await getAuthHeader();

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    unauthorizedListeners.forEach((cb) => cb());
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
