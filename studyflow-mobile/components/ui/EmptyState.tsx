import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={36} color="#9ca3af" />
      </View>
      <Text className="text-lg font-semibold text-gray-700">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-400 mt-1 text-center px-8">{subtitle}</Text>}
    </View>
  );
}
