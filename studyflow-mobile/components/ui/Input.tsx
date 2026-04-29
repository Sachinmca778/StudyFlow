import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export default function Input({ label, error, required, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}
      <TextInput
        className={`border rounded-lg px-4 py-3 text-gray-900 bg-white text-base
          ${error ? 'border-red-400' : 'border-gray-300'}
          ${props.editable === false ? 'bg-gray-100 text-gray-500' : ''}
        `}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
