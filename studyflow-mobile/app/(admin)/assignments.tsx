import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
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
    title: '', description: '', subject: '', assignment_type: 'homework' as typeof TYPES[number],
    batch_id: '', due_date: '', total_marks: '',
  });

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      supabase.from('assignments').select('*, batch:batches(name, course_name)')
        .eq('institute_id', institute.id).order('created_at', { ascending: false }),
      supabase.from('batches').select('id, name, course_name').eq('institute_id', institute.id).eq('is_active', true),
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
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('assignments').delete().eq('id', id); fetchAll(); } },
    ]);
  };

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Assignments" showBack rightAction={{ icon: 'add-circle', onPress: () => setShowModal(true) }} />

      <View className="bg-white px-4 py-2 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput className="flex-1 ml-2 text-gray-900 text-sm" placeholder="Search assignments..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} colors={['#4f46e5']} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No assignments" subtitle="Create your first assignment" />}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.due_date, item.is_active);
            const batch = item.batch as any;
            return (
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="font-bold text-gray-900 flex-1 mr-2">{item.title}</Text>
                  <Badge label={badge.label} variant={badge.variant} />
                </View>
                <Text className="text-primary-600 text-sm font-medium">{item.subject}</Text>
                {item.description && <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>{item.description}</Text>}
                <View className="flex-row flex-wrap gap-3 mt-2">
                  <View className="flex-row items-center">
                    <Ionicons name="school-outline" size={13} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">{batch?.name || 'No batch'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">Due: {item.due_date}</Text>
                  </View>
                  {item.total_marks && (
                    <View className="flex-row items-center">
                      <Ionicons name="star-outline" size={13} color="#9ca3af" />
                      <Text className="text-gray-500 text-xs ml-1">{item.total_marks} marks</Text>
                    </View>
                  )}
                  <View className="bg-orange-50 px-2 py-0.5 rounded">
                    <Text className="text-orange-600 text-xs capitalize">{item.assignment_type}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="mt-3 flex-row items-center self-end px-3 py-1.5 bg-red-50 rounded-lg">
                  <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  <Text className="text-red-500 text-xs ml-1 font-medium">Delete</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Create Assignment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <Input label="Title" value={form.title} onChangeText={v => update('title', v)} placeholder="Assignment title" required />
            <Input label="Subject" value={form.subject} onChangeText={v => update('subject', v)} placeholder="e.g. Mathematics" required />
            <Input label="Description" value={form.description} onChangeText={v => update('description', v)} placeholder="Optional description" multiline numberOfLines={3} />
            <Input label="Due Date" value={form.due_date} onChangeText={v => update('due_date', v)} placeholder="YYYY-MM-DD" required />
            <Input label="Total Marks" value={form.total_marks} onChangeText={v => update('total_marks', v)} placeholder="e.g. 100" keyboardType="numeric" />

            {/* Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => update('assignment_type', t)}
                    className={`px-3 py-2 rounded-lg border ${form.assignment_type === t ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}>
                    <Text className={`text-xs font-medium capitalize ${form.assignment_type === t ? 'text-white' : 'text-gray-600'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Batch */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Batch <Text className="text-red-500">*</Text></Text>
              <ScrollView className="max-h-36 border border-gray-200 rounded-lg" nestedScrollEnabled>
                {batches.map(b => (
                  <TouchableOpacity key={b.id} onPress={() => update('batch_id', b.id)}
                    className={`px-4 py-3 border-b border-gray-50 ${form.batch_id === b.id ? 'bg-primary-50' : ''}`}>
                    <Text className={`font-medium text-sm ${form.batch_id === b.id ? 'text-primary-600' : 'text-gray-900'}`}>{b.name}</Text>
                    <Text className="text-gray-400 text-xs">{b.course_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Button title="Create Assignment" onPress={handleSave} loading={saving} className="mb-8" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
