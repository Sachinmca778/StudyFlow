import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { PerformanceWithStudent, InstituteStudent } from '@/lib/institute-types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';

const getGradeColor = (pct: number) => {
  if (pct >= 75) return { text: 'text-green-600', bg: 'bg-green-50' };
  if (pct >= 50) return { text: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { text: 'text-red-600', bg: 'bg-red-50' };
};

export default function PerformanceScreen() {
  const { institute } = useAuthStore();
  const [records, setRecords] = useState<PerformanceWithStudent[]>([]);
  const [students, setStudents] = useState<InstituteStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    student_id: '', exam_name: '', subject: '', exam_date: '',
    total_marks: '', marks_obtained: '', grade: '', rank: '', remarks: '',
  });

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from('student_performance')
        .select('*, student:institute_students(student_name, enrollment_number)')
        .eq('institute_id', institute.id).order('created_at', { ascending: false }),
      supabase.from('institute_students').select('id, student_name, enrollment_number')
        .eq('institute_id', institute.id).eq('status', 'active'),
    ]);
    setRecords(r || []);
    setStudents(s || []);
    setLoading(false);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!form.student_id || !form.exam_name || !form.subject || !form.total_marks || !form.marks_obtained) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    const total = parseFloat(form.total_marks);
    const obtained = parseFloat(form.marks_obtained);
    const pct = Math.round((obtained / total) * 100);
    setSaving(true);
    try {
      const { error } = await supabase.from('student_performance').insert({
        institute_id: institute!.id,
        student_id: form.student_id,
        exam_name: form.exam_name.trim(),
        subject: form.subject.trim(),
        exam_date: form.exam_date || null,
        total_marks: total,
        marks_obtained: obtained,
        percentage: pct,
        grade: form.grade || null,
        rank: form.rank ? parseInt(form.rank) : null,
        remarks: form.remarks || null,
      });
      if (error) throw error;
      Alert.alert('Success', 'Performance record added');
      setShowModal(false);
      setForm({ student_id: '', exam_name: '', subject: '', exam_date: '', total_marks: '', marks_obtained: '', grade: '', rank: '', remarks: '' });
      fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter(r => {
    const name = (r.student as any)?.student_name?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || r.exam_name.toLowerCase().includes(search.toLowerCase());
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Performance Reports" showBack rightAction={{ icon: 'add-circle', onPress: () => setShowModal(true) }} />

      <View className="bg-white px-4 py-2 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput className="flex-1 ml-2 text-gray-900 text-sm" placeholder="Search by student or exam..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
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
          ListEmptyComponent={<EmptyState icon="bar-chart-outline" title="No performance records" subtitle="Add exam results to track student performance" />}
          renderItem={({ item }) => {
            const student = item.student as any;
            const pct = item.percentage || 0;
            const colors = getGradeColor(pct);
            return (
              <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900">{student?.student_name}</Text>
                    <Text className="text-gray-500 text-xs">{student?.enrollment_number}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-lg ${colors.bg}`}>
                    <Text className={`font-bold text-base ${colors.text}`}>{pct}%</Text>
                  </View>
                </View>
                <View className="mt-2">
                  <Text className="text-primary-600 font-semibold text-sm">{item.exam_name}</Text>
                  <Text className="text-gray-500 text-xs">{item.subject}</Text>
                </View>
                <View className="flex-row flex-wrap gap-3 mt-2">
                  <Text className="text-gray-500 text-xs">
                    Marks: <Text className="font-semibold text-gray-700">{item.marks_obtained}/{item.total_marks}</Text>
                  </Text>
                  {item.grade && <Text className="text-gray-500 text-xs">Grade: <Text className="font-semibold">{item.grade}</Text></Text>}
                  {item.rank && <Text className="text-gray-500 text-xs">Rank: <Text className="font-semibold">#{item.rank}</Text></Text>}
                  {item.exam_date && <Text className="text-gray-500 text-xs">{item.exam_date}</Text>}
                </View>
                {/* Progress bar */}
                <View className="mt-2 h-1.5 bg-gray-100 rounded-full">
                  <View className={`h-1.5 rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">Add Result</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            {/* Student Picker */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Student <Text className="text-red-500">*</Text></Text>
              <ScrollView className="max-h-36 border border-gray-200 rounded-lg" nestedScrollEnabled>
                {students.map(s => (
                  <TouchableOpacity key={s.id} onPress={() => update('student_id', s.id)}
                    className={`px-4 py-3 border-b border-gray-50 ${form.student_id === s.id ? 'bg-primary-50' : ''}`}>
                    <Text className={`font-medium text-sm ${form.student_id === s.id ? 'text-primary-600' : 'text-gray-900'}`}>{s.student_name}</Text>
                    <Text className="text-gray-400 text-xs">{s.enrollment_number}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Input label="Exam Name" value={form.exam_name} onChangeText={v => update('exam_name', v)} placeholder="e.g. Unit Test 1" required />
            <Input label="Subject" value={form.subject} onChangeText={v => update('subject', v)} placeholder="e.g. Mathematics" required />
            <Input label="Exam Date" value={form.exam_date} onChangeText={v => update('exam_date', v)} placeholder="YYYY-MM-DD" />
            <Input label="Total Marks" value={form.total_marks} onChangeText={v => update('total_marks', v)} placeholder="e.g. 100" keyboardType="numeric" required />
            <Input label="Marks Obtained" value={form.marks_obtained} onChangeText={v => update('marks_obtained', v)} placeholder="e.g. 85" keyboardType="numeric" required />
            <Input label="Grade" value={form.grade} onChangeText={v => update('grade', v)} placeholder="e.g. A+" />
            <Input label="Rank" value={form.rank} onChangeText={v => update('rank', v)} placeholder="e.g. 3" keyboardType="numeric" />
            <Input label="Remarks" value={form.remarks} onChangeText={v => update('remarks', v)} placeholder="Optional remarks" multiline numberOfLines={2} />
            <Button title="Add Result" onPress={handleSave} loading={saving} className="mb-8" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
