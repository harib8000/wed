import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User { id: string; phone: string; role: string; }

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (u: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('access_token'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (access, refresh) => {
    Cookies.set('access_token', access, { expires: 1/96, sameSite: 'lax' });
    Cookies.set('refresh_token', refresh, { expires: 30, sameSite: 'lax' });
    localStorage.setItem('access_token', access);
    set({ isAuthenticated: true });
  },
  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));
