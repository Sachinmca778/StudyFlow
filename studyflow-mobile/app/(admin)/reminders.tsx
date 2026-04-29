import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
  Linking, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';

const STATUS_BADGE: Record<string, any> = {
  pending: 'warning', sent: 'info', paid: 'success', overdue: 'danger',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function RemindersScreen() {
  const { institute } = useAuthStore();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchReminders(); }, [institute?.id]);

  const fetchReminders = async () => {
    if (!institute) return;
    const { data } = await supabase
      .from('fee_reminders')
      .select('*, student:institute_students(student_name, phone, parent_phone, enrollment_number)')
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false });
    setReminders(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  const generateReminders = async () => {
    if (!institute) return;
    setGenerating(true);
    try {
      const { data: pendingFees } = await supabase
        .from('fee_payments')
        .select('*, student:institute_students(student_name, phone)')
        .eq('institute_id', institute.id)
        .in('status', ['pending', 'overdue']);

      if (!pendingFees || pendingFees.length === 0) {
        Alert.alert('Info', 'No pending fees found');
        return;
      }

      const records = pendingFees.map(fee => ({
        institute_id: institute.id,
        student_id: fee.student_id,
        amount_due: fee.amount,
        due_date: fee.payment_date,
        reminder_type: 'whatsapp',
        status: fee.status === 'overdue' ? 'overdue' : 'pending',
        message: `Dear Parent, fees of ₹${fee.amount} for ${(fee.student as any)?.student_name} is ${fee.status}. Please pay at the earliest.`,
      }));

      const { error } = await supabase.from('fee_reminders').insert(records);
      if (error) throw error;
      Alert.alert('Success', `${records.length} reminders generated`);
      fetchReminders();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const sendWhatsApp = (phone: string, message: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=91${cleaned}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'WhatsApp not installed'));
  };

  const markAsSent = async (id: string) => {
    await supabase.from('fee_reminders')
      .update({ status: 'sent', reminder_sent_at: new Date().toISOString() })
      .eq('id', id);
    fetchReminders();
  };

  return (
    <SafeAreaView style={styles.flex}>
      <ScreenHeader title="Fee Reminders" showBack />

      <View style={styles.genBox}>
        <Button
          title="Generate Reminders from Pending Fees"
          onPress={generateReminders}
          loading={generating}
          icon={<Ionicons name="refresh" size={16} color="#fff" />}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchReminders(); }}
              colors={['#4f46e5']}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No reminders"
              subtitle="Generate reminders from pending fees"
            />
          }
          renderItem={({ item }) => {
            const student = item.student as any;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{student?.student_name}</Text>
                    <Text style={styles.cardSub}>{student?.enrollment_number}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.amountText}>{fmt(item.amount_due)}</Text>
                    <Badge label={item.status} variant={STATUS_BADGE[item.status]} />
                  </View>
                </View>

                {item.message ? (
                  <View style={styles.msgBox}>
                    <Text style={styles.msgText} numberOfLines={3}>{item.message}</Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  {student?.phone && (
                    <TouchableOpacity
                      onPress={() => sendWhatsApp(student.phone, item.message || '')}
                      style={[styles.actionBtn, styles.waBtn]}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
                      <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {student?.phone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${student.phone}`)}
                      style={[styles.actionBtn, styles.callBtn]}
                    >
                      <Ionicons name="call" size={16} color="#2563eb" />
                      <Text style={[styles.actionBtnText, { color: '#2563eb' }]}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => markAsSent(item.id)}
                      style={[styles.actionBtn, styles.sentBtn]}
                    >
                      <Ionicons name="checkmark" size={16} color="#4b5563" />
                      <Text style={[styles.actionBtnText, { color: '#4b5563' }]}>Mark Sent</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  genBox: {
    backgroundColor: '#fff', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  amountText: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  msgBox: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 10, marginBottom: 12 },
  msgText: { fontSize: 12, color: '#4b5563', lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  waBtn: { backgroundColor: '#f0fdf4' },
  callBtn: { backgroundColor: '#eff6ff' },
  sentBtn: { backgroundColor: '#f3f4f6' },
});
