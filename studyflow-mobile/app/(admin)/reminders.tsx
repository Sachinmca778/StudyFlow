import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator, Linking,
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
      // Find all pending/overdue fee payments
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
    await supabase.from('fee_reminders').update({ status: 'sent', reminder_sent_at: new Date().toISOString() }).eq('id', id);
    fetchReminders();
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Fee Reminders" showBack />

      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Button
          title="Generate Reminders from Pending Fees"
          onPress={generateReminders}
          loading={generating}
          icon={<Ionicons name="refresh" size={16} color="#fff" />}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReminders(); }} colors={['#4f46e5']} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="notifications-outline" title="No reminders" subtitle="Generate reminders from pending fees" />}
          renderItem={({ item }) => {
            const student = item.student as any;
            return (
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900">{student?.student_name}</Text>
                    <Text className="text-gray-400 text-xs">{student?.enrollment_number}</Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-bold text-red-600">{fmt(item.amount_due)}</Text>
                    <Badge label={item.status} variant={STATUS_BADGE[item.status]} />
                  </View>
                </View>

                {item.message && (
                  <View className="bg-gray-50 rounded-lg p-2 mb-3">
                    <Text className="text-gray-600 text-xs" numberOfLines={3}>{item.message}</Text>
                  </View>
                )}

                <View className="flex-row gap-2">
                  {student?.phone && (
                    <TouchableOpacity
                      onPress={() => sendWhatsApp(student.phone, item.message || '')}
                      className="flex-1 flex-row items-center justify-center py-2 bg-green-50 rounded-lg"
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#22c55e" />
                      <Text className="text-green-600 text-xs font-semibold ml-1">WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                  {student?.phone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${student.phone}`)}
                      className="flex-1 flex-row items-center justify-center py-2 bg-blue-50 rounded-lg"
                    >
                      <Ionicons name="call" size={16} color="#3b82f6" />
                      <Text className="text-blue-600 text-xs font-semibold ml-1">Call</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => markAsSent(item.id)}
                      className="flex-1 flex-row items-center justify-center py-2 bg-gray-100 rounded-lg"
                    >
                      <Ionicons name="checkmark" size={16} color="#6b7280" />
                      <Text className="text-gray-600 text-xs font-semibold ml-1">Mark Sent</Text>
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
