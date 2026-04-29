import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { Batch } from '@/lib/institute-types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function BatchesScreen() {
  const { institute } = useAuthStore();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', course_name: '', description: '', start_date: '',
    end_date: '', class_level: '', total_seats: '', fee_amount: '',
    schedule_time: '', teacher_name: '', schedule_days: [] as string[],
  });

  useEffect(() => { fetchBatches(); }, [institute?.id]);

  const fetchBatches = async () => {
    if (!institute) return;
    const { data } = await supabase
      .from('batches').select('*')
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false });
    setBatches(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.course_name.trim()) {
      Alert.alert('Error', 'Batch name and course name are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('batches').insert({
        institute_id: institute!.id,
        name: form.name.trim(),
        course_name: form.course_name.trim(),
        description: form.description || null,
        start_date: form.start_date || new Date().toISOString().split('T')[0],
        end_date: form.end_date || null,
        class_level: form.class_level || null,
        total_seats: form.total_seats ? parseInt(form.total_seats) : null,
        fee_amount: form.fee_amount ? parseFloat(form.fee_amount) : 0,
        schedule_days: form.schedule_days.length > 0 ? form.schedule_days : null,
        schedule_time: form.schedule_time || null,
        teacher_name: form.teacher_name || null,
        enrolled_students: 0,
        is_active: true,
      });
      if (error) throw error;
      Alert.alert('Success', 'Batch created successfully');
      setShowModal(false);
      setForm({
        name: '', course_name: '', description: '', start_date: '',
        end_date: '', class_level: '', total_seats: '', fee_amount: '',
        schedule_time: '', teacher_name: '', schedule_days: [],
      });
      fetchBatches();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (batch: Batch) => {
    await supabase.from('batches').update({ is_active: !batch.is_active }).eq('id', batch.id);
    fetchBatches();
  };

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Batches</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>New Batch</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBatches(); }}
              colors={['#4f46e5']}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="school-outline"
              title="No batches yet"
              subtitle="Create your first batch to start enrolling students"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardCourse}>{item.course_name}</Text>
                </View>
                <Badge label={item.is_active ? 'Active' : 'Inactive'} variant={item.is_active ? 'success' : 'gray'} />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>{item.enrolled_students}/{item.total_seats || '∞'} students</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>{fmt(item.fee_amount)}/mo</Text>
                </View>
                {item.teacher_name && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.teacher_name}</Text>
                  </View>
                )}
                {item.schedule_time && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.schedule_time}</Text>
                  </View>
                )}
              </View>

              {item.schedule_days && item.schedule_days.length > 0 && (
                <View style={styles.daysRow}>
                  {item.schedule_days.map(d => (
                    <View key={d} style={styles.dayPill}>
                      <Text style={styles.dayText}>{d}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.total_seats ? (
                <View style={styles.progressBox}>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min((item.enrolled_students / item.total_seats) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round((item.enrolled_students / item.total_seats) * 100)}% enrolled
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => handleToggleActive(item)}
                style={[styles.toggleBtn, item.is_active ? styles.toggleBtnGray : styles.toggleBtnPrimary]}
              >
                <Text style={[styles.toggleBtnText, item.is_active ? styles.toggleBtnTextGray : styles.toggleBtnTextPrimary]}>
                  {item.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Batch Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.flex}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Batch</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.flex} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input label="Batch Name" value={form.name} onChangeText={v => update('name', v)} placeholder="e.g. Morning Batch A" required />
            <Input label="Course Name" value={form.course_name} onChangeText={v => update('course_name', v)} placeholder="e.g. Mathematics" required />
            <Input label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="Optional description" multiline numberOfLines={2} />
            <Input label="Class Level" value={form.class_level} onChangeText={v => update('class_level', v)} placeholder="e.g. Class 10" />
            <Input label="Start Date" value={form.start_date} onChangeText={v => update('start_date', v)} placeholder="YYYY-MM-DD" />
            <Input label="End Date" value={form.end_date} onChangeText={v => update('end_date', v)} placeholder="YYYY-MM-DD (optional)" />
            <Input label="Total Seats" value={form.total_seats} onChangeText={v => update('total_seats', v)} placeholder="e.g. 30" keyboardType="numeric" />
            <Input label="Fee Amount (₹/month)" value={form.fee_amount} onChangeText={v => update('fee_amount', v)} placeholder="e.g. 2000" keyboardType="numeric" />
            <Input label="Schedule Time" value={form.schedule_time} onChangeText={v => update('schedule_time', v)} placeholder="e.g. 9:00 AM - 11:00 AM" />
            <Input label="Teacher Name" value={form.teacher_name} onChangeText={v => update('teacher_name', v)} placeholder="Assigned teacher" />

            {/* Schedule Days */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Schedule Days</Text>
              <View style={styles.daysGrid}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(d)}
                    style={[styles.daySelectBtn, form.schedule_days.includes(d) && styles.daySelectBtnActive]}
                  >
                    <Text style={[styles.daySelectText, form.schedule_days.includes(d) && styles.daySelectTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Create Batch" onPress={handleSave} loading={saving} />
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
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardTitleBox: { flex: 1, marginRight: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardCourse: { fontSize: 13, color: '#4f46e5', fontWeight: '500', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  dayPill: { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dayText: { fontSize: 11, color: '#4f46e5', fontWeight: '600' },
  progressBox: { marginBottom: 10 },
  progressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: '#4f46e5', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#9ca3af' },
  toggleBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  toggleBtnGray: { backgroundColor: '#f3f4f6' },
  toggleBtnPrimary: { backgroundColor: '#eef2ff' },
  toggleBtnText: { fontSize: 13, fontWeight: '600' },
  toggleBtnTextGray: { color: '#4b5563' },
  toggleBtnTextPrimary: { color: '#4f46e5' },
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
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  daySelectBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  daySelectBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  daySelectText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  daySelectTextActive: { color: '#fff' },
});
