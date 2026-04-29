import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
}

const COLORS = {
  primary: { bg: '#4f46e5', text: '#ffffff', border: '#4f46e5' },
  secondary: { bg: '#4b5563', text: '#ffffff', border: '#4b5563' },
  danger: { bg: '#dc2626', text: '#ffffff', border: '#dc2626' },
  outline: { bg: 'transparent', text: '#4f46e5', border: '#4f46e5' },
};

export default function Button({
  title,
  variant = 'primary',
  loading,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const c = COLORS[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        style as any,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#4f46e5' : '#fff'} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.text,
              { color: c.text, marginLeft: icon ? 8 : 0 },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
