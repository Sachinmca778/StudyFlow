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
import { AssignmentWithBatch, Batch } from '@/lib/institute-types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';

const TYPES = ['homework', 'project', 'assignment', 'practical'] as const;

const getStatusBadge = (dueDate: string, isActive: boolean) => {
  if (!isActive) return { label: 'Inactive', variant: 'gray' as const };
  const today = new Date().toISOString().split('T')[0];
  if (dueDate < today) return { label: 'Expired', variant: 'danger' as const };
  if (dueDate === today) return { label: 'Due Today', variant: 'warning' as const };
  return { label: 'Active', variant: 'success' as const };
};

export default function AssignmentsScreen() {
  const { institute } = useAuthStore();
  const [assignments, setAssignments] = useState<AssignmentWithBatch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', subject: '',
    assignment_type: 'homework' as typeof TYPES[number],
    batch_id: '', due_date: '', total_marks: '',
  });

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      supabase.from('assignments')
        .select('*, batch:batches(name, course_name)')
        .eq('institute_id', institute.id)
        .order('created_at', { ascending: false }),
      supabase.from('batches').select('id, name, course_name')
        .eq('institute_id', institute.id).eq('is_active', true),
    ]);
    setAssignments(a || []);
    setBatches(b || []);
    setLoading(false);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subject.trim() || !form.batch_id || !form.due_date) {
      Alert.alert('Error', 'Title, subject, batch and due date are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('assignments').insert({
        institute_id: institute!.id,
        batch_id: form.batch_id,
        title: form.title.trim(),
        description: form.description || null,
        subject: form.subject.trim(),
        assignment_type: form.assignment_type,
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: form.due_date,
        total_marks: form.total_marks ? parseInt(form.total_marks) : null,
        is_active: true,
      });
      if (error) throw error;
      Alert.alert('Success', 'Assignment created');
      setShowModal(false);
      setForm({ title: '', description: '', subject: '', assignment_type: 'homework', batch_id: '', due_date: '', total_marks: '' });
      fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await supabase.from('assignments').delete().eq('id', id); fetchAll(); },
      },
    ]);
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView style={styles.flex}>
      <ScreenHeader
        title="Assignments"
        showBack
        rightAction={{ icon: 'add-circle', onPress: () => setShowModal(true) }}
      />

      <View style={styles.searchBox}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assignments..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>
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
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title="No assignments" subtitle="Create your first assignment" />
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.due_date, item.is_active);
            const batch = item.batch as any;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Badge label={badge.label} variant={badge.variant} />
                </View>
                <Text style={styles.subjectText}>{item.subject}</Text>
                {item.description ? (
                  <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="school-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{batch?.name || 'No batch'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>Due: {item.due_date}</Text>
                  </View>
                  {item.total_marks ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="star-outline" size={13} color="#9ca3af" />
                      <Text style={styles.metaText}>{item.total_marks} marks</Text>
                    </View>
                  ) : null}
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{item.assignment_type}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalFlex}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Assignment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalFlex} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input label="Title" value={form.title} onChangeText={v => update('title', v)} placeholder="Assignment title" required />
            <Input label="Subject" value={form.subject} onChangeText={v => update('subject', v)} placeholder="e.g. Mathematics" required />
            <Input label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="Optional description" multiline numberOfLines={3} />
            <Input label="Due Date" value={form.due_date} onChangeText={v => update('due_date', v)} placeholder="YYYY-MM-DD" required />
            <Input label="Total Marks" value={form.total_marks} onChangeText={v => update('total_marks', v)} placeholder="e.g. 100" keyboardType="numeric" />

            {/* Type */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.pillWrap}>
                {TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => update('assignment_type', t)}
                    style={[styles.pill, form.assignment_type === t && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, form.assignment_type === t && styles.pillTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Batch */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Batch <Text style={styles.required}>*</Text></Text>
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {batches.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => update('batch_id', b.id)}
                    style={[styles.pickerItem, form.batch_id === b.id && styles.pickerItemActive]}
                  >
                    <Text style={[styles.pickerName, form.batch_id === b.id && styles.pickerNameActive]}>
                      {b.name}
                    </Text>
                    <Text style={styles.pickerSub}>{b.course_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Button title="Create Assignment" onPress={handleSave} loading={saving} style={{ marginBottom: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  modalFlex: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  subjectText: { fontSize: 13, color: '#4f46e5', fontWeight: '600', marginBottom: 4 },
  descText: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  typePill: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typePillText: { fontSize: 11, color: '#ea580c', fontWeight: '600', textTransform: 'capitalize' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end',
    backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginTop: 10,
  },
  deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { padding: 16, paddingBottom: 40 },
  mb16: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  required: { color: '#ef4444' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#4b5563', textTransform: 'capitalize' },
  pillTextActive: { color: '#fff' },
  pickerList: { maxHeight: 150, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  pickerItemActive: { backgroundColor: '#eef2ff' },
  pickerName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  pickerNameActive: { color: '#4f46e5' },
  pickerSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});
