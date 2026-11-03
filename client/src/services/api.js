import axios from 'axios';

// In-memory CSRF token store (never stored in persistent localStorage)
let inMemoryCsrfToken = null;
let pendingCsrfPromise = null;

export const setCsrfToken = (token) => {
  inMemoryCsrfToken = token;
};

export const clearCsrfToken = () => {
  inMemoryCsrfToken = null;
};

export const getCsrfToken = () => inMemoryCsrfToken;

// Helper to read cookie by name (used as same-origin fallback if accessible)
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch CSRF token from backend /api/csrf-token endpoint with credentials.
 * Deduplicates concurrent calls via a shared in-flight promise.
 */
export const fetchCsrfToken = async () => {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;

  if (pendingCsrfPromise) {
    return pendingCsrfPromise;
  }

  pendingCsrfPromise = (async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || '/api';
      const res = await axios.get(`${baseURL}/csrf-token`, {
        withCredentials: true,
      });
      const token = res.data?.data?.csrfToken;
      if (token) {
        inMemoryCsrfToken = token;
      }
      return inMemoryCsrfToken;
    } catch (err) {
      console.warn('[CSRF] Failed to retrieve CSRF token:', err.message);
      return null;
    } finally {
      pendingCsrfPromise = null;
    }
  })();

  return pendingCsrfPromise;
};

// Request interceptor to attach JWT token and CSRF token if present
api.interceptors.request.use(
  async (config) => {
    // 1. Attach JWT Authorization header if present
    const token = localStorage.getItem('lostlecture_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Attach CSRF token on state-changing methods (POST, PUT, PATCH, DELETE)
    const method = (config.method || 'GET').toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isStateChanging) {
      let csrfToken = inMemoryCsrfToken;

      // Fallback: check document.cookie (if same-origin)
      if (!csrfToken) {
        csrfToken = getCookie('XSRF-TOKEN');
        if (csrfToken) {
          inMemoryCsrfToken = csrfToken;
        }
      }

      // If still missing and not calling /csrf-token itself, fetch token
      if (!csrfToken && !config.url?.includes('/csrf-token')) {
        csrfToken = await fetchCsrfToken();
      }

      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        config.headers['X-XSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token capture and unified error formatting
api.interceptors.response.use(
  (response) => {
    // Capture CSRF token if returned in response data (e.g. login, register, csrf-token)
    if (response?.data?.data?.csrfToken) {
      inMemoryCsrfToken = response.data.data.csrfToken;
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    
    // Auto logout if 401 unauthorized
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('lostlecture_token');
      localStorage.removeItem('lostlecture_user');
      clearCsrfToken();
      // Redirect to login only if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status: error.response?.status,
      message,
      errors: error.response?.data?.errors || [],
    });
  }
);

export default api;
