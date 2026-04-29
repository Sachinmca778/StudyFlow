import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';

const menuItems = [
  {
    section: 'Academic',
    items: [
      { label: 'Assignments', icon: 'document-text', color: '#f97316', bg: '#fff7ed', route: '/(admin)/assignments' },
      { label: 'Attendance', icon: 'checkmark-done-circle', color: '#22c55e', bg: '#f0fdf4', route: '/(admin)/attendance' },
      { label: 'Performance', icon: 'bar-chart', color: '#8b5cf6', bg: '#f5f3ff', route: '/(admin)/performance' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { label: 'Announcements', icon: 'megaphone', color: '#3b82f6', bg: '#eff6ff', route: '/(admin)/communication' },
      { label: 'Fee Reminders', icon: 'notifications', color: '#ef4444', bg: '#fef2f2', route: '/(admin)/reminders' },
    ],
  },
  {
    section: 'Data',
    items: [
      { label: 'Bulk Import', icon: 'cloud-upload', color: '#14b8a6', bg: '#f0fdfa', route: '/(admin)/bulk-import' },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Institute Settings', icon: 'settings', color: '#6b7280', bg: '#f9fafb', route: '/(admin)/settings' },
    ],
  },
];

export default function MoreScreen() {
  const { institute, reset } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">More</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Institute Info Card */}
        <View className="mx-4 mt-4 bg-primary-600 rounded-xl p-4 mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-3">
              <Ionicons name="school" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base" numberOfLines={1}>{institute?.name}</Text>
              <Text className="text-white/70 text-xs mt-0.5">{institute?.city}, {institute?.state}</Text>
              <Text className="text-white/70 text-xs">{institute?.email}</Text>
            </View>
          </View>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 bg-white/10 rounded-lg p-2 items-center">
              <Text className="text-white font-bold">{institute?.total_students || 0}</Text>
              <Text className="text-white/70 text-xs">Students</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-lg p-2 items-center">
              <Text className="text-white font-bold capitalize">{institute?.subscription_plan}</Text>
              <Text className="text-white/70 text-xs">Plan</Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-lg p-2 items-center">
              <Text className="text-white font-bold">{institute?.total_staff || 0}</Text>
              <Text className="text-white/70 text-xs">Staff</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map(section => (
          <View key={section.section} className="mx-4 mb-4">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.section}
            </Text>
            <View className="bg-white rounded-xl overflow-hidden border border-gray-100">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  className={`flex-row items-center px-4 py-3.5 ${idx < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <View className={`w-9 h-9 rounded-lg items-center justify-center mr-3`} style={{ backgroundColor: item.bg }}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text className="flex-1 text-gray-900 font-medium">{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View className="mx-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-xl px-4 py-3.5 flex-row items-center border border-red-100"
          >
            <View className="w-9 h-9 bg-red-50 rounded-lg items-center justify-center mr-3">
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </View>
            <Text className="flex-1 text-red-500 font-medium">Logout</Text>
            <Ionicons name="chevron-forward" size={16} color="#fca5a5" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
