import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { InstituteStudent, Batch } from '@/lib/institute-types';
import { generateEnrollmentNumber } from '@/lib/enrollment';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';

const CLASS_LEVELS = [
  'Nursery','KG','LKG','UKG',
  'Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10',
  'Class 11','Class 12',
];

const statusBadge = (s: string): any => {
  const map: Record<string, any> = {
    active: 'success', inactive: 'gray', suspended: 'danger', graduated: 'info',
  };
  return map[s] || 'gray';
};

export default function StudentsScreen() {
  const { institute } = useAuthStore();
  const [students, setStudents] = useState<InstituteStudent[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  const [form, setForm] = useState({
    student_name: '', email: '', phone: '', parent_name: '',
    parent_phone: '', date_of_birth: '', gender: 'male',
    address: '', enrollment_number: '', class_level: '', batch_id: '',
  });

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    const [{ data: s }, { data: b }] = await Promise.all([
      supabase.from('institute_students').select('*')
        .eq('institute_id', institute.id).order('created_at', { ascending: false }),
      supabase.from('batches').select('*')
        .eq('institute_id', institute.id).eq('is_active', true),
    ]);
    setStudents(s || []);
    setBatches(b || []);
    setLoading(false);
    setRefreshing(false);
  };

  const openAddModal = async () => {
    setShowModal(true);
    setEnrollmentLoading(true);
    try {
      const enr = await generateEnrollmentNumber(institute!.id, institute!.name);
      setForm(prev => ({ ...prev, enrollment_number: enr }));
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.student_name.trim() || !form.phone.trim()) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('institute_students').insert({
        institute_id: institute!.id,
        student_name: form.student_name.trim(),
        email: form.email || null,
        phone: form.phone.trim(),
        parent_name: form.parent_name || null,
        parent_phone: form.parent_phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender as any,
        address: form.address || null,
        enrollment_number: form.enrollment_number || null,
        class_level: form.class_level || null,
        batch_id: form.batch_id || null,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      if (error) throw error;
      Alert.alert('Success', 'Student added successfully');
      setShowModal(false);
      setForm({
        student_name: '', email: '', phone: '', parent_name: '',
        parent_phone: '', date_of_birth: '', gender: 'male',
        address: '', enrollment_number: '', class_level: '', batch_id: '',
      });
      fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Student', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('institute_students').delete().eq('id', id);
          fetchAll();
        },
      },
    ]);
  };

  const filtered = students.filter(s => {
    const matchSearch =
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.enrollment_number || '').includes(search);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Students</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, enrollment..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['all', 'active', 'inactive', 'suspended', 'graduated'].map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilterStatus(s)}
              style={[styles.chip, filterStatus === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, filterStatus === s && styles.chipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
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
            <EmptyState
              icon="people-outline"
              title="No students found"
              subtitle="Add your first student to get started"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.student_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.student_name}</Text>
                  <Text style={styles.cardSub}>
                    {item.enrollment_number || 'No enrollment #'}
                  </Text>
                </View>
                <Badge label={item.status} variant={statusBadge(item.status)} />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="call-outline" size={13} color="#9ca3af" />
                  <Text style={styles.metaText}>{item.phone}</Text>
                </View>
                {item.class_level && (
                  <View style={styles.metaItem}>
                    <Ionicons name="school-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.class_level}</Text>
                  </View>
                )}
                {item.parent_name && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{item.parent_name}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.student_name)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Student Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.flex}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Input label="Full Name" value={form.student_name} onChangeText={v => update('student_name', v)} placeholder="Student full name" required />
            <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" required />
            <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="student@email.com" keyboardType="email-address" autoCapitalize="none" />

            {/* Enrollment Number */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Enrollment Number</Text>
              <View style={styles.enrollBox}>
                {enrollmentLoading
                  ? <ActivityIndicator size="small" color="#4f46e5" />
                  : <Text style={styles.enrollText}>{form.enrollment_number}</Text>
                }
              </View>
            </View>

            {/* Class Level */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Class Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CLASS_LEVELS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => update('class_level', c)}
                    style={[styles.pill, form.class_level === c && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, form.class_level === c && styles.pillTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Batch */}
            {batches.length > 0 && (
              <View style={styles.mb16}>
                <Text style={styles.fieldLabel}>Assign Batch</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => update('batch_id', '')}
                    style={[styles.pill, !form.batch_id && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, !form.batch_id && styles.pillTextActive]}>None</Text>
                  </TouchableOpacity>
                  {batches.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => update('batch_id', b.id)}
                      style={[styles.pill, form.batch_id === b.id && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, form.batch_id === b.id && styles.pillTextActive]}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Input label="Parent Name" value={form.parent_name} onChangeText={v => update('parent_name', v)} placeholder="Parent/Guardian name" />
            <Input label="Parent Phone" value={form.parent_phone} onChangeText={v => update('parent_phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" />
            <Input label="Date of Birth" value={form.date_of_birth} onChangeText={v => update('date_of_birth', v)} placeholder="YYYY-MM-DD" />
            <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="Full address" multiline numberOfLines={2} />

            {/* Gender */}
            <View style={styles.mb16}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['male', 'female', 'other'].map(g => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => update('gender', g)}
                    style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                  >
                    <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Add Student" onPress={handleSave} loading={saving} />
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
  searchBox: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  chipScroll: { marginBottom: 4 },
  chip: {
    marginRight: 8, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#4f46e5' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4b5563', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end',
    backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '600', marginLeft: 4 },
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
  enrollBox: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#f9fafb',
    minHeight: 48, justifyContent: 'center',
  },
  enrollText: { fontSize: 15, color: '#374151' },
  pill: {
    marginRight: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#4b5563' },
  pillTextActive: { color: '#fff' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#fff',
  },
  genderBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  genderText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  genderTextActive: { color: '#fff' },
});
