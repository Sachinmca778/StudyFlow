import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/auth';

export default function Index() {
  const { session, institute, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/(auth)/login');
    } else if (!institute) {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(admin)');
    }
  }, [session, institute, loading]);

  return (
    <View className="flex-1 items-center justify-center bg-primary-600">
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
