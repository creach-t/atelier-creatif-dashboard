const TOKEN_KEY = 'dashboard_access_token';

export function getAccessToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || '';
  } catch (err) {
    return '';
  }
}

export function setAccessToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    // localStorage indisponible (navigation privée, etc.) — on continue sans persister.
  }
}

export function clearAccessToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    // no-op
  }
}

const unauthorizedListeners = new Set();

export function onUnauthorized(callback) {
  unauthorizedListeners.add(callback);
  return () => unauthorizedListeners.delete(callback);
}

async function request(path, options = {}) {
  const token = getAccessToken();

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearAccessToken();
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
