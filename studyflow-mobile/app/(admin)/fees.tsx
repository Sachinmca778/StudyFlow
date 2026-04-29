import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { FeePaymentWithStudent, InstituteStudent } from '@/lib/institute-types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'] as const;
const STATUS_COLORS: Record<string, any> = {
  paid: 'success', pending: 'warning', overdue: 'danger', cancelled: 'gray',
};

export default function FeesScreen() {
  const { institute } = useAuthStore();
  const [payments, setPayments] = useState<FeePaymentWithStudent[]>([]);
  const [students, setStudents] = useState<InstituteStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState({ collected: 0, pending: 0, overdue: 0 });

  const [form, setForm] = useState({
    student_id: '', amount: '', payment_method: 'cash' as typeof PAYMENT_METHODS[number],
    transaction_id: '', month_year: '', notes: '', status: 'paid',
  });

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('fee_payments').select('*, student:institute_students(student_name, phone, enrollment_number)')
        .eq('institute_id', institute.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('institute_students').select('id, student_name, phone, enrollment_number')
        .eq('institute_id', institute.id).eq('status', 'active'),
    ]);
    setPayments(p || []);
    setStudents(s || []);

    // Summary
    const all = p || [];
    setSummary({
      collected: all.filter(x => x.status === 'paid').reduce((s, x) => s + Number(x.amount), 0),
      pending: all.filter(x => x.status === 'pending').reduce((s, x) => s + Number(x.amount), 0),
      overdue: all.filter(x => x.status === 'overdue').reduce((s, x) => s + Number(x.amount), 0),
    });
    setLoading(false);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!form.student_id || !form.amount) {
      Alert.alert('Error', 'Student and amount are required');
      return;
    }
    setSaving(true);
    try {
      const receiptNum = `RCP-${Date.now()}`;
      const { error } = await supabase.from('fee_payments').insert({
        institute_id: institute!.id,
        student_id: form.student_id,
        amount: parseFloat(form.amount),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: form.payment_method,
        transaction_id: form.transaction_id || null,
        receipt_number: receiptNum,
        month_year: form.month_year || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status: form.status as any,
        notes: form.notes || null,
        created_by: institute!.admin_user_id,
      });
      if (error) throw error;
      Alert.alert('Success', `Payment recorded! Receipt: ${receiptNum}`);
      setShowModal(false);
      setForm({ student_id: '', amount: '', payment_method: 'cash', transaction_id: '', month_year: '', notes: '', status: 'paid' });
      fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = payments.filter(p => {
    const name = (p.student as any)?.student_name?.toLowerCase() || '';
    const matchSearch = name.includes(search.toLowerCase()) || (p.receipt_number || '').includes(search);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Fee Management</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} className="bg-primary-600 px-4 py-2 rounded-lg flex-row items-center">
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold ml-1 text-sm">Record</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={['#4f46e5']} />}
          ListHeaderComponent={
            <View className="px-4 pt-4">
              {/* Summary Cards */}
              <View className="flex-row gap-2 mb-4">
                <View className="flex-1 bg-green-50 rounded-xl p-3 border border-green-100">
                  <Text className="text-xs text-green-600 font-medium">Collected</Text>
                  <Text className="text-base font-bold text-green-700 mt-0.5">{fmt(summary.collected)}</Text>
                </View>
                <View className="flex-1 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                  <Text className="text-xs text-yellow-600 font-medium">Pending</Text>
                  <Text className="text-base font-bold text-yellow-700 mt-0.5">{fmt(summary.pending)}</Text>
                </View>
                <View className="flex-1 bg-red-50 rounded-xl p-3 border border-red-100">
                  <Text className="text-xs text-red-600 font-medium">Overdue</Text>
                  <Text className="text-base font-bold text-red-700 mt-0.5">{fmt(summary.overdue)}</Text>
                </View>
              </View>

              {/* Search */}
              <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3">
                <Ionicons name="search" size={16} color="#9ca3af" />
                <TextInput className="flex-1 ml-2 text-gray-900 text-sm" placeholder="Search by student or receipt..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
              </View>

              {/* Filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                {['all', 'paid', 'pending', 'overdue', 'cancelled'].map(s => (
                  <TouchableOpacity key={s} onPress={() => setFilterStatus(s)}
                    className={`mr-2 px-3 py-1.5 rounded-full ${filterStatus === s ? 'bg-primary-600' : 'bg-white border border-gray-200'}`}>
                    <Text className={`text-xs font-medium capitalize ${filterStatus === s ? 'text-white' : 'text-gray-600'}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="cash-outline" title="No payments found" subtitle="Record your first fee payment" />}
          renderItem={({ item }) => {
            const student = item.student as any;
            return (
              <View className="bg-white mx-4 rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{student?.student_name || 'Unknown'}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{item.receipt_number}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-gray-900 text-base">{fmt(item.amount)}</Text>
                    <Badge label={item.status} variant={STATUS_COLORS[item.status]} />
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-3 mt-2">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">{item.payment_date}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="card-outline" size={13} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1 capitalize">{item.payment_method.replace('_', ' ')}</Text>
                  </View>
                  {item.month_year && (
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={13} color="#9ca3af" />
                      <Text className="text-gray-500 text-xs ml-1">{item.month_year}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Record Payment Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Record Payment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            {/* Student Picker */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Select Student <Text className="text-red-500">*</Text></Text>
              <ScrollView className="max-h-40 border border-gray-200 rounded-lg" nestedScrollEnabled>
                {students.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => update('student_id', s.id)}
                    className={`px-4 py-3 border-b border-gray-50 ${form.student_id === s.id ? 'bg-primary-50' : ''}`}
                  >
                    <Text className={`font-medium text-sm ${form.student_id === s.id ? 'text-primary-600' : 'text-gray-900'}`}>{s.student_name}</Text>
                    <Text className="text-gray-400 text-xs">{s.enrollment_number} · {s.phone}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Input label="Amount (₹)" value={form.amount} onChangeText={v => update('amount', v)} placeholder="e.g. 2000" keyboardType="numeric" required />
            <Input label="Month/Year" value={form.month_year} onChangeText={v => update('month_year', v)} placeholder="e.g. April 2026" />
            <Input label="Transaction ID" value={form.transaction_id} onChangeText={v => update('transaction_id', v)} placeholder="UPI/Bank ref (optional)" />
            <Input label="Notes" value={form.notes} onChangeText={v => update('notes', v)} placeholder="Optional notes" multiline numberOfLines={2} />

            {/* Payment Method */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Payment Method</Text>
              <View className="flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => update('payment_method', m)}
                    className={`px-3 py-2 rounded-lg border ${form.payment_method === m ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-medium capitalize ${form.payment_method === m ? 'text-white' : 'text-gray-600'}`}>{m.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
              <View className="flex-row gap-2">
                {['paid', 'pending', 'overdue'].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => update('status', s)}
                    className={`flex-1 py-2.5 rounded-lg border items-center ${form.status === s ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-medium capitalize ${form.status === s ? 'text-white' : 'text-gray-600'}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Record Payment" onPress={handleSave} loading={saving} className="mb-8" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
