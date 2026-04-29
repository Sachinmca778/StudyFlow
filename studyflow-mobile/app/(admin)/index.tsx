import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAll(); }, [institute?.id]);

  const fetchAll = async () => {
    await Promise.all([fetchStats(), fetchRecentActivities()]);
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

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView
        style={styles.flex}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            colors={['#4f46e5']}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerBg}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.instituteName} numberOfLines={1}>
                {institute?.name || 'Institute'}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="school" size={22} color="#fff" />
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.headerMetaText}>{institute?.city}, {institute?.state}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{institute?.subscription_plan}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Stats Row 1 */}
          <View style={styles.statsRow}>
            <StatCard title="Total Students" value={stats.totalStudents} icon="people" iconBg="#dbeafe" iconColor="#2563eb" subtitle={`${stats.activeStudents} active`} />
            <StatCard title="Active Batches" value={stats.totalBatches} icon="school" iconBg="#ede9fe" iconColor="#7c3aed" />
          </View>

          {/* Stats Row 2 */}
          <View style={styles.statsRow}>
            <StatCard title="Monthly Revenue" value={fmt(stats.monthlyRevenue)} icon="cash" iconBg="#dcfce7" iconColor="#16a34a" />
            <StatCard title="Pending Fees" value={fmt(stats.pendingFees)} icon="alert-circle" iconBg="#fee2e2" iconColor="#dc2626" />
          </View>

          {/* Stats Row 3 */}
          <View style={[styles.statsRow, styles.mb16]}>
            <StatCard title="Today Present" value={stats.todayAttendance} icon="checkmark-circle" iconBg="#ccfbf1" iconColor="#0d9488" />
            <StatCard title="Assignments" value={stats.totalAssignments} icon="document-text" iconBg="#ffedd5" iconColor="#ea580c" subtitle={`${stats.pendingAssignments} active`} />
          </View>

          {/* Recent Enrollments */}
          <Card style={styles.mb16}>
            <Text style={styles.cardTitle}>Recent Enrollments</Text>
            {recentActivities.length === 0 ? (
              <Text style={styles.emptyText}>No students yet</Text>
            ) : (
              recentActivities.map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.activityRow,
                    i < recentActivities.length - 1 && styles.activityRowBorder,
                  ]}
                >
                  <View style={styles.activityAvatar}>
                    <Text style={styles.activityAvatarText}>
                      {s.student_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{s.student_name}</Text>
                    <Text style={styles.activitySub}>{s.enrollment_number}</Text>
                  </View>
                  <Text style={styles.activityDate}>
                    {new Date(s.enrollment_date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {/* Quick Actions */}
          <Card style={styles.mb16}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {[
                { label: 'Add Student', icon: 'person-add', color: '#4f46e5', bg: '#eef2ff' },
                { label: 'Attendance', icon: 'checkmark-done', color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Record Fee', icon: 'cash', color: '#d97706', bg: '#fffbeb' },
                { label: 'Announce', icon: 'megaphone', color: '#dc2626', bg: '#fef2f2' },
              ].map(action => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.quickAction, { backgroundColor: action.bg }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name={action.icon as any} size={16} color={action.color} />
                  <Text style={[styles.quickActionText, { color: action.color }]}>
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  headerBg: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcomeText: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  instituteName: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  headerIcon: {
    width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  headerMeta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 12,
  },
  headerMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 6, flex: 1 },
  planBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  planBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  body: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  mb16: { marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activityRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  activityAvatar: {
    width: 36, height: 36, backgroundColor: '#eef2ff',
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  activityAvatarText: { fontSize: 15, fontWeight: '700', color: '#4f46e5' },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  activitySub: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  activityDate: { fontSize: 11, color: '#9ca3af' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  quickActionText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
});
