import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        Alert.alert('Success', 'Account created! Please check your email to verify.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Check if institute exists
        const { data: inst } = await supabase
          .from('institutes')
          .select('id')
          .eq('admin_user_id', data.user.id)
          .single();
        if (inst) router.replace('/(admin)');
        else router.replace('/(auth)/onboarding');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-16 pb-12 items-center">
          <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="school" size={36} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-white">StudyFlow</Text>
          <Text className="text-primary-100 mt-1">Institute Management</Text>
        </View>

        {/* Form */}
        <View className="flex-1 px-6 pt-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text className="text-gray-500 mb-8">
            {isSignUp ? 'Register your institute admin account' : 'Sign in to manage your institute'}
          </Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@institute.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            required
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Password <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 border-0 mb-0"
                style={{ flex: 1, borderWidth: 0, marginBottom: 0 }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4"
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleAuth}
            loading={loading}
            className="mt-2"
          />

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            className="mt-6 items-center"
          >
            <Text className="text-gray-500">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text className="text-primary-600 font-semibold">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
