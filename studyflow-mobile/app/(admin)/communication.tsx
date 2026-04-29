import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { Announcement } from '@/lib/institute-types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import ScreenHeader from '@/components/ui/ScreenHeader';

const TYPES = ['general', 'urgent', 'event', 'holiday', 'exam', 'fee'] as const;
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
const AUDIENCES = ['all', 'students', 'parents', 'staff'] as const;

const priorityBadge = (p: string): any => {
  const map: Record<string, any> = { low: 'gray', normal: 'info', high: 'warning', urgent: 'danger' };
  return map[p] || 'gray';
};

const typeIcon: Record<string, any> = {
  general: 'information-circle', urgent: 'warning', event: 'calendar',
  holiday: 'sunny', exam: 'document-text', fee: 'cash',
};

export default function CommunicationScreen() {
  const { institute } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', content: '',
    announcement_type: 'general' as typeof TYPES[number],
    target_audience: 'all' as typeof AUDIENCES[number],
    priority: 'normal' as typeof PRIORITIES[number],
    expiry_date: '',
  });

  useEffect(() => { fetchAnnouncements(); }, [institute?.id]);

  const fetchAnnouncements = async () => {
    if (!institute) return;
    const { data } = await supabase
      .from('announcements').select('*')
      .eq('institute_id', institute.id).order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        institute_id: institute!.id,
        title: form.title.trim(),
        content: form.content.trim(),
        announcement_type: form.announcement_type,
        target_audience: form.target_audience,
        priority: form.priority,
        expiry_date: form.expiry_date || null,
        published_date: new Date().toISOString().split('T')[0],
        is_active: true,
        created_by: institute!.admin_user_id,
      });
      if (error) throw error;
      Alert.alert('Success', 'Announcement published');
      setShowModal(false);
      setForm({ title: '', content: '', announcement_type: 'general', target_audience: 'all', priority: 'normal', expiry_date: '' });
      fetchAnnouncements();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('announcements').delete().eq('id', id); fetchAnnouncements(); } },
    ]);
  };

  const filtered = announcements.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Communication" showBack rightAction={{ icon: 'add-circle', onPress: () => setShowModal(true) }} />

      <View className="bg-white px-4 py-2 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput className="flex-1 ml-2 text-gray-900 text-sm" placeholder="Search announcements..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }} colors={['#4f46e5']} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={<EmptyState icon="megaphone-outline" title="No announcements" subtitle="Create your first announcement" />}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-8 h-8 bg-primary-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name={typeIcon[item.announcement_type] || 'information-circle'} size={16} color="#4f46e5" />
                  </View>
                  <Text className="font-bold text-gray-900 flex-1" numberOfLines={2}>{item.title}</Text>
                </View>
                <Badge label={item.priority} variant={priorityBadge(item.priority)} />
              </View>
              <Text className="text-gray-600 text-sm" numberOfLines={3}>{item.content}</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                <View className="bg-blue-50 px-2 py-0.5 rounded">
                  <Text className="text-blue-600 text-xs capitalize">{item.announcement_type}</Text>
                </View>
                <View className="bg-gray-50 px-2 py-0.5 rounded">
                  <Text className="text-gray-500 text-xs capitalize">→ {item.target_audience}</Text>
                </View>
                <Text className="text-gray-400 text-xs">{item.published_date}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} className="mt-3 flex-row items-center self-end px-3 py-1.5 bg-red-50 rounded-lg">
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1 font-medium">Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-900">New Announcement</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            <Input label="Title" value={form.title} onChangeText={v => update('title', v)} placeholder="Announcement title" required />
            <Input label="Content" value={form.content} onChangeText={v => update('content', v)} placeholder="Write your announcement..." multiline numberOfLines={5} required />
            <Input label="Expiry Date" value={form.expiry_date} onChangeText={v => update('expiry_date', v)} placeholder="YYYY-MM-DD (optional)" />

            {/* Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => update('announcement_type', t)}
                    className={`px-3 py-2 rounded-lg border ${form.announcement_type === t ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}>
                    <Text className={`text-xs font-medium capitalize ${form.announcement_type === t ? 'text-white' : 'text-gray-600'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Priority</Text>
              <View className="flex-row gap-2">
                {PRIORITIES.map(p => (
                  <TouchableOpacity key={p} onPress={() => update('priority', p)}
                    className={`flex-1 py-2.5 rounded-lg border items-center ${form.priority === p ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}>
                    <Text className={`text-xs font-medium capitalize ${form.priority === p ? 'text-white' : 'text-gray-600'}`}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Audience */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Target Audience</Text>
              <View className="flex-row flex-wrap gap-2">
                {AUDIENCES.map(a => (
                  <TouchableOpacity key={a} onPress={() => update('target_audience', a)}
                    className={`px-3 py-2 rounded-lg border ${form.target_audience === a ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}>
                    <Text className={`text-xs font-medium capitalize ${form.target_audience === a ? 'text-white' : 'text-gray-600'}`}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="Publish Announcement" onPress={handleSave} loading={saving} className="mb-8" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
