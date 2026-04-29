import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { InstituteStudent } from '@/lib/institute-types';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Button from '@/components/ui/Button';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present:  { label: 'P', color: '#22c55e', bg: '#f0fdf4' },
  absent:   { label: 'A', color: '#ef4444', bg: '#fef2f2' },
  late:     { label: 'L', color: '#f59e0b', bg: '#fffbeb' },
  half_day: { label: 'H', color: '#8b5cf6', bg: '#f5f3ff' },
  leave:    { label: 'LV', color: '#6b7280', bg: '#f9fafb' },
};

export default function AttendanceScreen() {
  const { institute } = useAuthStore();
  const [students, setStudents] = useState<InstituteStudent[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterClass, setFilterClass] = useState('all');
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => { fetchStudents(); }, [institute?.id]);
  useEffect(() => { if (students.length > 0) fetchAttendance(); }, [selectedDate, students]);

  const fetchStudents = async () => {
    if (!institute) return;
    const { data } = await supabase
      .from('institute_students').select('*')
      .eq('institute_id', institute.id).eq('status', 'active').order('student_name');
    setStudents(data || []);
    const uniqueClasses = [...new Set((data || []).map(s => s.class_level).filter(Boolean))] as string[];
    setClasses(uniqueClasses);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchAttendance = async () => {
    if (!institute) return;
    const { data } = await supabase
      .from('student_attendance').select('student_id, status')
      .eq('institute_id', institute.id).eq('attendance_date', selectedDate);
    const map: Record<string, AttendanceStatus> = {};
    (data || []).forEach(r => { map[r.student_id] = r.status as AttendanceStatus; });
    setAttendance(map);
  };

  const toggleStatus = (studentId: string) => {
    const order: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day', 'leave'];
    const current = attendance[studentId] || 'absent';
    const next = order[(order.indexOf(current) + 1) % order.length];
    setAttendance(prev => ({ ...prev, [studentId]: next }));
  };

  const markAll = (status: AttendanceStatus) => {
    const map: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => { map[s.id] = status; });
    setAttendance(prev => ({ ...prev, ...map }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = filteredStudents.map(s => ({
        institute_id: institute!.id,
        student_id: s.id,
        attendance_date: selectedDate,
        status: attendance[s.id] || 'absent',
        marked_by: institute!.admin_user_id,
      }));

      // Upsert attendance
      const { error } = await supabase.from('student_attendance').upsert(records, {
        onConflict: 'institute_id,student_id,attendance_date',
      });
      if (error) throw error;
      Alert.alert('Success', `Attendance saved for ${selectedDate}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = filterClass === 'all'
    ? students
    : students.filter(s => s.class_level === filterClass);

  const stats = {
    present: filteredStudents.filter(s => attendance[s.id] === 'present').length,
    absent: filteredStudents.filter(s => attendance[s.id] === 'absent').length,
    late: filteredStudents.filter(s => attendance[s.id] === 'late').length,
    unmarked: filteredStudents.filter(s => !attendance[s.id]).length,
  };

  // Date navigation
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Attendance" showBack />

      {/* Date Picker */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => changeDate(-1)} className="p-2 bg-gray-100 rounded-lg">
            <Ionicons name="chevron-back" size={18} color="#374151" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="font-bold text-gray-900">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            <Text className="text-xs text-gray-400">{selectedDate}</Text>
          </View>
          <TouchableOpacity onPress={() => changeDate(1)} className="p-2 bg-gray-100 rounded-lg">
            <Ionicons name="chevron-forward" size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row gap-2 mb-3">
          {[
            { label: 'Present', count: stats.present, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Absent', count: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Late', count: stats.late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Unmarked', count: stats.unmarked, color: 'text-gray-600', bg: 'bg-gray-50' },
          ].map(s => (
            <View key={s.label} className={`flex-1 ${s.bg} rounded-lg p-2 items-center`}>
              <Text className={`font-bold text-base ${s.color}`}>{s.count}</Text>
              <Text className={`text-xs ${s.color}`}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Class filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          {['all', ...classes].map(c => (
            <TouchableOpacity key={c} onPress={() => setFilterClass(c)}
              className={`mr-2 px-3 py-1.5 rounded-full ${filterClass === c ? 'bg-primary-600' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-medium ${filterClass === c ? 'text-white' : 'text-gray-600'}`}>{c === 'all' ? 'All Classes' : c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mark All */}
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => markAll('present')} className="flex-1 bg-green-50 py-2 rounded-lg items-center">
            <Text className="text-green-600 text-xs font-semibold">All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => markAll('absent')} className="flex-1 bg-red-50 py-2 rounded-lg items-center">
            <Text className="text-red-600 text-xs font-semibold">All Absent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} colors={['#4f46e5']} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const status = attendance[item.id] || null;
            const cfg = status ? STATUS_CONFIG[status] : null;
            return (
              <View className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center shadow-sm border border-gray-100">
                <View className="w-9 h-9 bg-primary-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-primary-600 font-bold">{item.student_name.charAt(0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 text-sm">{item.student_name}</Text>
                  <Text className="text-gray-400 text-xs">{item.class_level || 'No class'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleStatus(item.id)}
                  className="w-12 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: cfg?.bg || '#f9fafb' }}
                >
                  <Text className="font-bold text-sm" style={{ color: cfg?.color || '#9ca3af' }}>
                    {cfg?.label || '?'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <Button title={`Save Attendance (${filteredStudents.length} students)`} onPress={handleSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
}
