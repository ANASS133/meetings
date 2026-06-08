import { createContext } from 'react';

export const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 'ADMIN',
  PHOTOGRAPHER: 'PHOTOGRAPHER',
  USER: 'USER',
};
