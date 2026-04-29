import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalBatches: number;
  monthlyRevenue: number;
  pendingFees: number;
  todayAttendance: number;
  totalAssignments: number;
  pendingAssignments: number;
}

export default function DashboardScreen() {
  const { institute } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, activeStudents: 0, totalBatches: 0,
    monthlyRevenue: 0, pendingFees: 0, todayAttendance: 0,
    totalAssignments: 0, pendingAssignments: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    if (!institute) return;
    await Promise.all([fetchStats(), fetchRecentActivities()]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    if (!institute) return;
    const id = institute.id;

    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: totalBatches },
    ] = await Promise.all([
      supabase.from('institute_students').select('*', { count: 'exact', head: true }).eq('institute_id', id),
      supabase.from('institute_students').select('*', { count: 'exact', head: true }).eq('institute_id', id).eq('status', 'active'),
      supabase.from('batches').select('*', { count: 'exact', head: true }).eq('institute_id', id).eq('is_active', true),
    ]);

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const { data: payments } = await supabase
      .from('fee_payments').select('amount').eq('institute_id', id).eq('status', 'paid').eq('month_year', currentMonth);
    const monthlyRevenue = payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;

    const { data: pending } = await supabase
      .from('fee_payments').select('amount').eq('institute_id', id).in('status', ['pending', 'overdue']);
    const pendingFees = pending?.reduce((s, p) => s + Number(p.amount), 0) || 0;

    const today = new Date().toISOString().split('T')[0];
    const { count: todayAttendance } = await supabase
      .from('student_attendance').select('*', { count: 'exact', head: true })
      .eq('institute_id', id).eq('attendance_date', today).eq('status', 'present');

    const { count: totalAssignments } = await supabase
      .from('assignments').select('*', { count: 'exact', head: true }).eq('institute_id', id).eq('is_active', true);

    const { count: pendingAssignments } = await supabase
      .from('assignments').select('*', { count: 'exact', head: true })
      .eq('institute_id', id).eq('is_active', true).gte('due_date', today);

    setStats({
      totalStudents: totalStudents || 0,
      activeStudents: activeStudents || 0,
      totalBatches: totalBatches || 0,
      monthlyRevenue,
      pendingFees,
      todayAttendance: todayAttendance || 0,
      totalAssignments: totalAssignments || 0,
      pendingAssignments: pendingAssignments || 0,
    });
  };

  const fetchRecentActivities = async () => {
    if (!institute) return;
    const { data } = await supabase
      .from('institute_students')
      .select('student_name, enrollment_date, enrollment_number')
      .eq('institute_id', institute.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentActivities(data || []);
  };

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
      >
        {/* Header */}
        <View className="bg-primary-600 px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/80 text-sm">Welcome back,</Text>
              <Text className="text-white text-xl font-bold" numberOfLines={1}>
                {institute?.name || 'Institute'}
              </Text>
            </View>
            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Ionicons name="school" size={22} color="#fff" />
            </View>
          </View>
          <View className="mt-3 bg-white/10 rounded-lg px-3 py-2 flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#fff" />
            <Text className="text-white/80 text-xs ml-1">{institute?.city}, {institute?.state}</Text>
            <View className="ml-auto bg-white/20 px-2 py-0.5 rounded-full">
              <Text className="text-white text-xs capitalize">{institute?.subscription_plan}</Text>
            </View>
          </View>
        </View>

        <View className="px-4 -mt-3">
          {/* Stats Row 1 */}
          <View className="flex-row gap-3 mb-3">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon="people"
              iconBg="bg-blue-100"
              iconColor="#3b82f6"
              subtitle={`${stats.activeStudents} active`}
            />
            <StatCard
              title="Active Batches"
              value={stats.totalBatches}
              icon="school"
              iconBg="bg-purple-100"
              iconColor="#8b5cf6"
            />
          </View>

          {/* Stats Row 2 */}
          <View className="flex-row gap-3 mb-3">
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(stats.monthlyRevenue)}
              icon="cash"
              iconBg="bg-green-100"
              iconColor="#22c55e"
            />
            <StatCard
              title="Pending Fees"
              value={formatCurrency(stats.pendingFees)}
              icon="alert-circle"
              iconBg="bg-red-100"
              iconColor="#ef4444"
            />
          </View>

          {/* Stats Row 3 */}
          <View className="flex-row gap-3 mb-4">
            <StatCard
              title="Today Present"
              value={stats.todayAttendance}
              icon="checkmark-circle"
              iconBg="bg-teal-100"
              iconColor="#14b8a6"
            />
            <StatCard
              title="Assignments"
              value={stats.totalAssignments}
              icon="document-text"
              iconBg="bg-orange-100"
              iconColor="#f97316"
              subtitle={`${stats.pendingAssignments} active`}
            />
          </View>

          {/* Recent Enrollments */}
          <Card className="mb-4">
            <Text className="text-base font-bold text-gray-900 mb-3">Recent Enrollments</Text>
            {recentActivities.length === 0 ? (
              <Text className="text-gray-400 text-sm text-center py-4">No students yet</Text>
            ) : (
              recentActivities.map((s, i) => (
                <View key={i} className={`flex-row items-center py-2.5 ${i < recentActivities.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <View className="w-9 h-9 bg-primary-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-primary-600 font-bold text-sm">
                      {s.student_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium text-sm">{s.student_name}</Text>
                    <Text className="text-gray-400 text-xs">{s.enrollment_number}</Text>
                  </View>
                  <Text className="text-gray-400 text-xs">
                    {new Date(s.enrollment_date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="mb-6">
            <Text className="text-base font-bold text-gray-900 mb-3">Quick Actions</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'Add Student', icon: 'person-add', color: '#4f46e5', bg: '#eef2ff' },
                { label: 'Mark Attendance', icon: 'checkmark-done', color: '#22c55e', bg: '#f0fdf4' },
                { label: 'Record Fee', icon: 'cash', color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Announcement', icon: 'megaphone', color: '#ef4444', bg: '#fef2f2' },
              ].map((action) => (
                <TouchableOpacity
                  key={action.label}
                  className="flex-row items-center px-3 py-2 rounded-lg"
                  style={{ backgroundColor: action.bg }}
                >
                  <Ionicons name={action.icon as any} size={16} color={action.color} />
                  <Text className="text-xs font-semibold ml-1.5" style={{ color: action.color }}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
