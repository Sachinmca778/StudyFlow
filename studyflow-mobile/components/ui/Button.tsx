import { Text, TouchableOpacity, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ 
  title, 
  variant = 'primary', 
  loading, 
  icon,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClass = 'flex-row items-center justify-center px-6 py-3 rounded-lg';
  const variants = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    danger: 'bg-red-600',
    outline: 'border-2 border-primary-600 bg-transparent',
  };
  const textVariants = {
    primary: 'text-white',
    secondary: 'text-white',
    danger: 'text-white',
    outline: 'text-primary-600',
  };

  return (
    <TouchableOpacity
      className={`${baseClass} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#4f46e5' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text className={`font-semibold text-base ${textVariants[variant]} ${icon ? 'ml-2' : ''}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
