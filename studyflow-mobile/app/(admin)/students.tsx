import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
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

const CLASS_LEVELS = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','Nursery','KG','LKG','UKG'];

const statusBadge = (s: string) => {
  const map: Record<string, any> = { active: 'success', inactive: 'gray', suspended: 'danger', graduated: 'info' };
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
      supabase.from('institute_students').select('*').eq('institute_id', institute.id).order('created_at', { ascending: false }),
      supabase.from('batches').select('*').eq('institute_id', institute.id).eq('is_active', true),
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
      setForm({ student_name: '', email: '', phone: '', parent_name: '', parent_phone: '', date_of_birth: '', gender: 'male', address: '', enrollment_number: '', class_level: '', batch_id: '' });
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
    const matchSearch = s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) || (s.enrollment_number || '').includes(search);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xl font-bold text-gray-900">Students</Text>
          <TouchableOpacity onPress={openAddModal} className="bg-primary-600 px-4 py-2 rounded-lg flex-row items-center">
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white font-semibold ml-1 text-sm">Add</Text>
          </TouchableOpacity>
        </View>
        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholder="Search by name, phone, enrollment..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
          />
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'active', 'inactive', 'suspended', 'graduated'].map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilterStatus(s)}
              className={`mr-2 px-3 py-1.5 rounded-full ${filterStatus === s ? 'bg-primary-600' : 'bg-gray-100'}`}
            >
              <Text className={`text-xs font-medium capitalize ${filterStatus === s ? 'text-white' : 'text-gray-600'}`}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No students found" subtitle="Add your first student to get started" />}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-11 h-11 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-primary-600 font-bold text-base">
                      {item.student_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">{item.student_name}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{item.enrollment_number || 'No enrollment #'}</Text>
                  </View>
                </View>
                <Badge label={item.status} variant={statusBadge(item.status)} />
              </View>
              <View className="mt-3 flex-row flex-wrap gap-3">
                <View className="flex-row items-center">
                  <Ionicons name="call-outline" size={13} color="#9ca3af" />
                  <Text className="text-gray-500 text-xs ml-1">{item.phone}</Text>
                </View>
                {item.class_level && (
                  <View className="flex-row items-center">
                    <Ionicons name="school-outline" size={13} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">{item.class_level}</Text>
                  </View>
                )}
                {item.parent_name && (
                  <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={13} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">{item.parent_name}</Text>
                  </View>
                )}
              </View>
              <View className="mt-3 flex-row justify-end gap-2">
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.student_name)}
                  className="flex-row items-center px-3 py-1.5 bg-red-50 rounded-lg"
                >
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  <Text className="text-red-500 text-xs ml-1 font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Student Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Add Student</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <Input label="Full Name" value={form.student_name} onChangeText={v => update('student_name', v)} placeholder="Student full name" required />
            <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" required />
            <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="student@email.com" keyboardType="email-address" autoCapitalize="none" />

            {/* Enrollment Number */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Enrollment Number</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-4 py-3">
                {enrollmentLoading ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <Text className="text-gray-700 flex-1">{form.enrollment_number}</Text>
                )}
              </View>
            </View>

            {/* Class Level */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Class Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CLASS_LEVELS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => update('class_level', c)}
                    className={`mr-2 px-3 py-2 rounded-lg border ${form.class_level === c ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-medium ${form.class_level === c ? 'text-white' : 'text-gray-600'}`}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Batch */}
            {batches.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Assign Batch</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => update('batch_id', '')}
                    className={`mr-2 px-3 py-2 rounded-lg border ${!form.batch_id ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-medium ${!form.batch_id ? 'text-white' : 'text-gray-600'}`}>None</Text>
                  </TouchableOpacity>
                  {batches.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => update('batch_id', b.id)}
                      className={`mr-2 px-3 py-2 rounded-lg border ${form.batch_id === b.id ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${form.batch_id === b.id ? 'text-white' : 'text-gray-600'}`}>{b.name}</Text>
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
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Gender</Text>
              <View className="flex-row gap-2">
                {['male', 'female', 'other'].map(g => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => update('gender', g)}
                    className={`flex-1 py-2.5 rounded-lg border items-center ${form.gender === g ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium capitalize ${form.gender === g ? 'text-white' : 'text-gray-600'}`}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Add Student" onPress={handleSave} loading={saving} className="mb-8" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
