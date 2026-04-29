import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';

export default function RootLayout() {
  const { setSession, setInstitute, setLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchInstitute(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchInstitute(session.user.id);
      else { setInstitute(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchInstitute = async (userId: string) => {
    const { data } = await supabase
      .from('institutes')
      .select('*')
      .eq('admin_user_id', userId)
      .single();
    setInstitute(data);
    setLoading(false);
  };

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}
