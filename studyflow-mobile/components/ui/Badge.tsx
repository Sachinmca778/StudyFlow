import { View, Text } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: 'bg-green-100', text: 'text-green-700' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  danger:  { bg: 'bg-red-100',   text: 'text-red-700' },
  info:    { bg: 'bg-blue-100',  text: 'text-blue-700' },
  gray:    { bg: 'bg-gray-100',  text: 'text-gray-600' },
};

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  const { bg, text } = variants[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{label}</Text>
    </View>
  );
}
