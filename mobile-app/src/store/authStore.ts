import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  token: string;
  user_id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (u: AuthUser) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (u) => set({ user: u }),
      logout:  ()  => set({ user: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'cardiac-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
