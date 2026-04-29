import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
}

export default function ScreenHeader({ title, subtitle, showBack, rightAction }: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-900">{title}</Text>
        {subtitle && <Text className="text-xs text-gray-500">{subtitle}</Text>}
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} className="p-2">
          <Ionicons name={rightAction.icon} size={24} color="#4f46e5" />
        </TouchableOpacity>
      )}
    </View>
  );
}
