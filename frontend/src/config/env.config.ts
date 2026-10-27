export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'skipli_access_token',
  THEME: 'skipli_theme',
} as const;
