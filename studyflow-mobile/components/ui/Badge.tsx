import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#dcfce7', text: '#15803d' },
  warning: { bg: '#fef9c3', text: '#a16207' },
  danger:  { bg: '#fee2e2', text: '#b91c1c' },
  info:    { bg: '#dbeafe', text: '#1d4ed8' },
  gray:    { bg: '#f3f4f6', text: '#4b5563' },
};

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  const { bg, text } = VARIANTS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
