import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const { user, setInstitute } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    registration_number: '',
    established_year: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.city.trim() || !form.state.trim()) {
      Alert.alert('Error', 'Please fill in city and state');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('institutes')
        .insert({
          admin_user_id: user!.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          registration_number: form.registration_number || null,
          established_year: form.established_year ? parseInt(form.established_year) : null,
          address: form.address || null,
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode || null,
          subscription_plan: 'free',
          is_active: true,
          total_students: 0,
          total_staff: 0,
        })
        .select()
        .single();

      if (error) throw error;
      setInstitute(data);
      router.replace('/(admin)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create institute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-14 pb-8">
          <Ionicons name="school" size={32} color="#fff" />
          <Text className="text-2xl font-bold text-white mt-3">Setup Your Institute</Text>
          <Text className="text-primary-100 mt-1">Step {step} of 2</Text>
          {/* Progress bar */}
          <View className="mt-4 h-1.5 bg-white/30 rounded-full">
            <View className={`h-1.5 bg-white rounded-full ${step === 1 ? 'w-1/2' : 'w-full'}`} />
          </View>
        </View>

        <View className="flex-1 px-6 pt-6">
          {step === 1 ? (
            <>
              <Text className="text-lg font-bold text-gray-900 mb-4">Basic Information</Text>
              <Input label="Institute Name" value={form.name} onChangeText={v => update('name', v)} placeholder="e.g. Bright Future Academy" required />
              <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="institute@email.com" keyboardType="email-address" autoCapitalize="none" required />
              <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" required />
              <Input label="Registration Number" value={form.registration_number} onChangeText={v => update('registration_number', v)} placeholder="Optional" />
              <Input label="Established Year" value={form.established_year} onChangeText={v => update('established_year', v)} placeholder="e.g. 2010" keyboardType="numeric" />
              <Button title="Next →" onPress={handleNext} className="mt-2" />
            </>
          ) : (
            <>
              <Text className="text-lg font-bold text-gray-900 mb-4">Address Details</Text>
              <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Street address" multiline numberOfLines={2} />
              <Input label="City" value={form.city} onChangeText={v => update('city', v)} placeholder="e.g. Mumbai" required />
              <Input label="State" value={form.state} onChangeText={v => update('state', v)} placeholder="e.g. Maharashtra" required />
              <Input label="Pincode" value={form.pincode} onChangeText={v => update('pincode', v)} placeholder="e.g. 400001" keyboardType="numeric" />
              <View className="flex-row gap-3 mt-2">
                <Button title="← Back" variant="outline" onPress={() => setStep(1)} className="flex-1" />
                <Button title="Create Institute" onPress={handleSubmit} loading={loading} className="flex-1" />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
