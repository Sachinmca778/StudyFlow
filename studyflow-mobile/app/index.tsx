import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/auth';

export default function Index() {
  const { session, institute, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace('/(auth)/login');
    else if (!institute) router.replace('/(auth)/onboarding');
    else router.replace('/(admin)');
  }, [session, institute, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
  },
});
