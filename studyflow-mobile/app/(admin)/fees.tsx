import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { FeePaymentWithStudent, InstituteStudent } from '@/lib/institute-types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'] as const;
const STATUS_COLORS: Record<string, any> = {
  paid: 'success', pending: 'warning', overdue: 'danger', cancelled: 'gray',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

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
    student_id: '', amount: '',
    payment_method: 'cash' as typeof PAYMENT_METHODS[number],
    transaction_id: '', month_year: '', notes: '', status: 'paid',
  });

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('fee_payments')
        .select('*, student:institute_students(student_name, phone, enrollment_number)')
        .eq('institute_id', institute.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('institute_students')
        .select('id, student_name, phone, enrollment_number')
        .eq('institute_id', institute.id)
        .eq('status', 'active'),
    ]);
    setPayments(p || []);
    setStudents(s || []);
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
        month_year: form.month_year ||
          new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        status: form.status as any,
        notes: form.notes || null,
        created_by: institute!.admin_user_id,
      });
      if (error) throw error;
      Alert.alert('Success', `Payment recorded!\nReceipt: ${receiptNum}`);
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
    const matchSearch = name.includes(search.toLowerCase()) ||
      (p.receipt_number || '').includes(search);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Management</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Record</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAll(); }}
              colors={['#4f46e5']}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Summary */}
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Text style={[styles.summaryLabel, { color: '#16a34a' }]}>Collected</Text>
                  <Text style={[styles.summaryValue, { color: '#15803d' }]}>{fmt(summary.collected)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#fefce8', borderColor: '#fde68a' }]}>
                  <Text style={[styles.summaryLabel, { color: '#ca8a04' }]}>Pending</Text>
                  <Text style={[styles.summaryValue, { color: '#a16207' }]}>{fmt(summary.pending)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                  <Text style={[styles.summaryLabel, { color: '#dc2626' }]}>Overdue</Text>
                  <Text style={[styles.summaryValue, { color: '#b91c1c' }]}>{fmt(summary.overdue)}</Text>
                </View>
              </View>

              {/* Search */}
              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by student or receipt..."
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {['all', 'paid', 'pending', 'overdue', 'cancelled'].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFilterStatus(s)}
                    style={[styles.chip, filterStatus === s && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState icon="cash-outline" title="No payments found" subtitle="Record your first fee payment" />
          }
          renderItem={({ item }) => {
            const student = item.student as any;
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{student?.student_name || 'Unknown'}</Text>
                    <Text style={styles.cardSub}>{item.receipt_number}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.amountText}>{fmt(item.amount)}</Text>
                    <Badge label={item.status} variant={STATUS_COLORS[item.status]} />
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.payment_date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="card-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.payment_method.replace('_', ' ')}</Text>
                  </View>
                  {item.month_year && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#9ca3af" />
                      <Text style={styles.metaText}>{item.month_year}</Text>
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
        <SafeAreaView style={styles.flex}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.flex} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Student Picker */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Select Student <Text style={styles.required}>*</Text></Text>
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {students.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => update('student_id', s.id)}
                    style={[styles.pickerItem, form.student_id === s.id && styles.pickerItemActive]}
                  >
                    <Text style={[styles.pickerName, form.student_id === s.id && styles.pickerNameActive]}>
                      {s.student_name}
                    </Text>
                    <Text style={styles.pickerSub}>{s.enrollment_number} · {s.phone}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Input label="Amount (₹)" value={form.amount} onChangeText={v => update('amount', v)} placeholder="e.g. 2000" keyboardType="numeric" required />
            <Input label="Month/Year" value={form.month_year} onChangeText={v => update('month_year', v)} placeholder="e.g. April 2026" />
            <Input label="Transaction ID" value={form.transaction_id} onChangeText={v => update('transaction_id', v)} placeholder="UPI/Bank ref (optional)" />
            <Input label="Notes" value={form.notes} onChangeText={v => update('notes', v)} placeholder="Optional notes" multiline numberOfLines={2} />

            {/* Payment Method */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <View style={styles.pillWrap}>
                {PAYMENT_METHODS.map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => update('payment_method', m)}
                    style={[styles.pill, form.payment_method === m && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, form.payment_method === m && styles.pillTextActive]}>
                      {m.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusRow}>
                {['paid', 'pending', 'overdue'].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => update('status', s)}
                    style={[styles.statusBtn, form.status === s && styles.statusBtnActive]}
                  >
                    <Text style={[styles.statusText, form.status === s && styles.statusTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Record Payment" onPress={handleSave} loading={saving} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4f46e5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 4 },
  listHeader: { paddingHorizontal: 16, paddingTop: 16 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: {
    flex: 1, borderRadius: 12, padding: 12, borderWidth: 1,
  },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  chipScroll: { marginBottom: 8 },
  chip: {
    marginRight: 8, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4b5563', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  listContent: { paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  amountText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4, textTransform: 'capitalize' },
  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { padding: 16, paddingBottom: 40 },
  mb16: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  required: { color: '#ef4444' },
  pickerList: {
    maxHeight: 160, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
  },
  pickerItem: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  pickerItemActive: { backgroundColor: '#eef2ff' },
  pickerName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  pickerNameActive: { color: '#4f46e5' },
  pickerSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#4b5563', textTransform: 'capitalize' },
  pillTextActive: { color: '#fff' },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#fff',
  },
  statusBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  statusTextActive: { color: '#fff' },
});
