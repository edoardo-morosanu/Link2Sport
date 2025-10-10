export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    CHECK_EMAIL: '/api/auth/check-email',
    CHECK_USERNAME: '/api/auth/check-username',
  },
  SPORTS: {
    GET_ALL: '/api/sports',
    GET_BY_ID: (id: number) => `/api/sports/${id}`,
    CREATE: '/api/sports',
    UPDATE: (id: number) => `/api/sports/${id}`,
    DELETE: (id: number) => `/api/sports/${id}`,
  },
  EVENTS: {
    GET_ALL: '/api/events',
    GET_BY_ID: (id: number) => `/api/events/${id}`,
    CREATE: '/api/events',
    UPDATE: (id: number) => `/api/events/${id}`,
    DELETE: (id: number) => `/api/events/${id}`,
  },
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
  },
  SEARCH: {
    USERS: '/api/search/users',
  },
  UPLOAD: {
    AVATAR: '/api/upload/avatar',
  },
};

export const DEFAULT_SPORTS = [
  'Football',
  'Basketball',
  'Tennis',
  'Swimming',
  'Running',
];
