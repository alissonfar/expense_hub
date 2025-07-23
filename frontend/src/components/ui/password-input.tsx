import { useState } from 'react';
import { Input } from './input';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  showStrengthIndicator?: boolean;
}

export const PasswordInput = ({ 
  error, 
  showStrengthIndicator = true, 
  onChange, 
  ...props 
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    if (!/\s/.test(password)) score++;
    
    return score;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStrength = checkPasswordStrength(e.target.value);
    setStrength(newStrength);
    onChange?.(e);
  };

  const getStrengthText = () => {
    if (strength <= 2) return { text: 'Fraca', color: 'text-red-500' };
    if (strength <= 4) return { text: 'Média', color: 'text-yellow-500' };
    return { text: 'Forte', color: 'text-green-500' };
  };

  const strengthText = getStrengthText();

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? 'text' : 'password'}
          onChange={handleChange}
          className={error ? 'border-red-500 pr-20' : 'pr-20'}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      
      {showStrengthIndicator && props.value && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span>Força da senha:</span>
            <span className={strengthText.color}>{strengthText.text}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded ${
                  level <= strength ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-1">
              {strength >= 1 ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
              <span>Pelo menos 8 caracteres</span>
            </div>
            <div className="flex items-center gap-1">
              {strength >= 2 ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
              <span>Uma letra minúscula</span>
            </div>
            <div className="flex items-center gap-1">
              {strength >= 3 ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
              <span>Uma letra maiúscula</span>
            </div>
            <div className="flex items-center gap-1">
              {strength >= 4 ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
              <span>Um número</span>
            </div>
            <div className="flex items-center gap-1">
              {strength >= 5 ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
              <span>Um caractere especial</span>
            </div>
            <div className="flex items-center gap-1">
              {strength >= 6 ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
              <span>Sem espaços</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 