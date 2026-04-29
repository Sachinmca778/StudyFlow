import { useState } from 'react';
import {
  View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { institute, setInstitute } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: institute?.name || '',
    email: institute?.email || '',
    phone: institute?.phone || '',
    registration_number: institute?.registration_number || '',
    established_year: institute?.established_year?.toString() || '',
    address: institute?.address || '',
    city: institute?.city || '',
    state: institute?.state || '',
    pincode: institute?.pincode || '',
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert('Error', 'Name, email and phone are required');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('institutes')
        .update({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          registration_number: form.registration_number || null,
          established_year: form.established_year ? parseInt(form.established_year) : null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', institute!.id)
        .select()
        .single();

      if (error) throw error;
      setInstitute(data);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Institute Settings" showBack />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">

          {/* Subscription Info */}
          <Card className="mb-4">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 bg-primary-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name="star" size={20} color="#4f46e5" />
              </View>
              <View>
                <Text className="font-bold text-gray-900">Subscription</Text>
                <Text className="text-gray-400 text-xs">Current plan details</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-primary-50 rounded-lg p-3 items-center">
                <Text className="text-primary-600 font-bold capitalize">{institute?.subscription_plan}</Text>
                <Text className="text-primary-400 text-xs">Plan</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-lg p-3 items-center">
                <Text className="text-gray-700 font-bold">{institute?.total_students}</Text>
                <Text className="text-gray-400 text-xs">Students</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-lg p-3 items-center">
                <Text className="text-gray-700 font-bold">{institute?.total_staff}</Text>
                <Text className="text-gray-400 text-xs">Staff</Text>
              </View>
            </View>
          </Card>

          {/* Basic Info */}
          <Card className="mb-4">
            <Text className="font-bold text-gray-900 mb-4">Basic Information</Text>
            <Input label="Institute Name" value={form.name} onChangeText={v => update('name', v)} placeholder="Institute name" required />
            <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="institute@email.com" keyboardType="email-address" autoCapitalize="none" required />
            <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" required />
            <Input label="Registration Number" value={form.registration_number} onChangeText={v => update('registration_number', v)} placeholder="Optional" />
            <Input label="Established Year" value={form.established_year} onChangeText={v => update('established_year', v)} placeholder="e.g. 2010" keyboardType="numeric" />
          </Card>

          {/* Address */}
          <Card className="mb-4">
            <Text className="font-bold text-gray-900 mb-4">Address</Text>
            <Input label="Street Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Street address" multiline numberOfLines={2} />
            <Input label="City" value={form.city} onChangeText={v => update('city', v)} placeholder="City" />
            <Input label="State" value={form.state} onChangeText={v => update('state', v)} placeholder="State" />
            <Input label="Pincode" value={form.pincode} onChangeText={v => update('pincode', v)} placeholder="Pincode" keyboardType="numeric" />
          </Card>

          <Button title="Save Settings" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
