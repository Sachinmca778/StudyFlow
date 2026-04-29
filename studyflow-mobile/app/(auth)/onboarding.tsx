import { useState } from 'react';
import {
  View, Text, ScrollView, Alert,
  KeyboardAvoidingView, Platform, StyleSheet,
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
    name: '', email: '', phone: '', registration_number: '',
    established_year: '', address: '', city: '', state: '', pincode: '',
  });

  const update = (key: string, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerBg}>
          <Ionicons name="school" size={32} color="#fff" />
          <Text style={styles.heading}>Setup Your Institute</Text>
          <Text style={styles.stepText}>Step {step} of 2</Text>
          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>
        </View>

        <View style={styles.formBox}>
          {step === 1 ? (
            <>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Input label="Institute Name" value={form.name} onChangeText={v => update('name', v)} placeholder="e.g. Bright Future Academy" required />
              <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="institute@email.com" keyboardType="email-address" autoCapitalize="none" required />
              <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" required />
              <Input label="Registration Number" value={form.registration_number} onChangeText={v => update('registration_number', v)} placeholder="Optional" />
              <Input label="Established Year" value={form.established_year} onChangeText={v => update('established_year', v)} placeholder="e.g. 2010" keyboardType="numeric" />
              <Button title="Next →" onPress={handleNext} />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Address Details</Text>
              <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Street address" multiline numberOfLines={2} />
              <Input label="City" value={form.city} onChangeText={v => update('city', v)} placeholder="e.g. Mumbai" required />
              <Input label="State" value={form.state} onChangeText={v => update('state', v)} placeholder="e.g. Maharashtra" required />
              <Input label="Pincode" value={form.pincode} onChangeText={v => update('pincode', v)} placeholder="e.g. 400001" keyboardType="numeric" />
              <View style={styles.btnRow}>
                <Button
                  title="← Back"
                  variant="outline"
                  onPress={() => setStep(1)}
                  style={styles.halfBtn}
                />
                <Button
                  title="Create Institute"
                  onPress={handleSubmit}
                  loading={loading}
                  style={styles.halfBtn}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  headerBg: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 12 },
  stepText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  progressBg: {
    marginTop: 16,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  formBox: { paddingHorizontal: 24, paddingTop: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  btnRow: { flexDirection: 'row', gap: 12 },
  halfBtn: { flex: 1 },
});
