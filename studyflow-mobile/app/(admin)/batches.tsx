import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
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
      .from('batches').select('*').eq('institute_id', institute.id).order('created_at', { ascending: false });
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
      setForm({ name: '', course_name: '', description: '', start_date: '', end_date: '', class_level: '', total_seats: '', fee_amount: '', schedule_time: '', teacher_name: '', schedule_days: [] });
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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Batches</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} className="bg-primary-600 px-4 py-2 rounded-lg flex-row items-center">
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold ml-1 text-sm">New Batch</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBatches(); }} colors={['#4f46e5']} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="school-outline" title="No batches yet" subtitle="Create your first batch to start enrolling students" />}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="font-bold text-gray-900 text-base">{item.name}</Text>
                  <Text className="text-primary-600 text-sm font-medium">{item.course_name}</Text>
                </View>
                <Badge label={item.is_active ? 'Active' : 'Inactive'} variant={item.is_active ? 'success' : 'gray'} />
              </View>

              <View className="flex-row flex-wrap gap-3 mt-2">
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={14} color="#9ca3af" />
                  <Text className="text-gray-500 text-xs ml-1">{item.enrolled_students}/{item.total_seats || '∞'} students</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="cash-outline" size={14} color="#9ca3af" />
                  <Text className="text-gray-500 text-xs ml-1">{formatCurrency(item.fee_amount)}/month</Text>
                </View>
                {item.teacher_name && (
                  <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={14} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">{item.teacher_name}</Text>
                  </View>
                )}
                {item.schedule_time && (
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                    <Text className="text-gray-500 text-xs ml-1">{item.schedule_time}</Text>
                  </View>
                )}
              </View>

              {item.schedule_days && item.schedule_days.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-2">
                  {item.schedule_days.map(d => (
                    <View key={d} className="bg-primary-50 px-2 py-0.5 rounded">
                      <Text className="text-primary-600 text-xs font-medium">{d}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Enrollment progress */}
              {item.total_seats && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-400">Enrollment</Text>
                    <Text className="text-xs text-gray-500">{Math.round((item.enrolled_students / item.total_seats) * 100)}%</Text>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full">
                    <View
                      className="h-1.5 bg-primary-500 rounded-full"
                      style={{ width: `${Math.min((item.enrolled_students / item.total_seats) * 100, 100)}%` }}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => handleToggleActive(item)}
                className={`mt-3 py-2 rounded-lg items-center ${item.is_active ? 'bg-gray-100' : 'bg-primary-50'}`}
              >
                <Text className={`text-xs font-semibold ${item.is_active ? 'text-gray-600' : 'text-primary-600'}`}>
                  {item.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add Batch Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Create Batch</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
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
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Schedule Days</Text>
              <View className="flex-row flex-wrap gap-2">
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(d)}
                    className={`px-4 py-2 rounded-lg border ${form.schedule_days.includes(d) ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium ${form.schedule_days.includes(d) ? 'text-white' : 'text-gray-600'}`}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Create Batch" onPress={handleSave} loading={saving} className="mb-8" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
