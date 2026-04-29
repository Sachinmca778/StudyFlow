import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon, iconBg, iconColor, subtitle }: StatCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <View className={`w-10 h-10 rounded-lg items-center justify-center ${iconBg}`}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-sm text-gray-500 mt-0.5">{title}</Text>
      {subtitle && <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>}
    </View>
  );
}
