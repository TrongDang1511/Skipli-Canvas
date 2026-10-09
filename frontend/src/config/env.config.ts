export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'skipli_access_token',
  REFRESH_TOKEN: 'skipli_refresh_token',
  THEME: 'skipli_theme',
} as const;
