import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
