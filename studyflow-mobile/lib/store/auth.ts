import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Institute } from '../institute-types';

interface AuthState {
  session: Session | null;
  user: User | null;
  institute: Institute | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setInstitute: (institute: Institute | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  institute: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInstitute: (institute) => set({ institute }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ session: null, user: null, institute: null, loading: false }),
}));
