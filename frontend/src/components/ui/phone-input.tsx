import { forwardRef } from 'react';
import { Input } from './input';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ error, onChange, ...props }, ref) => {
    const formatPhone = (value: string) => {
      // Remove tudo que não é dígito
      const numbers = value.replace(/\D/g, '');
      
      // Aplica máscara
      if (numbers.length <= 2) {
        return `(${numbers}`;
      } else if (numbers.length <= 6) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else if (numbers.length <= 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      e.target.value = formatted;
      onChange?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        maxLength={15}
        onChange={handleChange}
        className={error ? 'border-red-500' : ''}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput'; 