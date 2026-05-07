import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: 'customer' | 'vendor' | 'admin';
  status: string;
  phoneVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  setTokens: (accessToken, refreshToken) => {
    // Store in both cookie and localStorage for Next.js SSR support
    Cookies.set('access_token', accessToken, { expires: 1/96, sameSite: 'lax' });
    Cookies.set('refresh_token', refreshToken, { expires: 30, sameSite: 'lax' });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
    }
    set({ accessToken, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    set({ user: null, isAuthenticated: false, accessToken: null });
  },
}));
