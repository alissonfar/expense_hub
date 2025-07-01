import { useState, useCallback } from 'react';

export interface PasswordStrength {
  score: number;
  text: string;
  color: string;
  isValid: boolean;
  errors: string[];
}

export const usePasswordStrength = () => {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    text: '',
    color: '',
    isValid: false,
    errors: []
  });

  const calculateStrength = useCallback((password: string): PasswordStrength => {
    if (!password) {
      return {
        score: 0,
        text: '',
        color: '',
        isValid: false,
        errors: []
      };
    }

    const errors: string[] = [];
    let score = 0;

    // Critérios baseados no backend/utils/password.ts
    if (password.length >= 8) score++;
    else errors.push('Senha deve ter pelo menos 8 caracteres');

    if (password.length <= 128) {
      if (password.length > 8) score++;
    } else {
      errors.push('Senha deve ter no máximo 128 caracteres');
    }

    if (/[a-z]/.test(password)) score++;
    else errors.push('Senha deve conter pelo menos uma letra minúscula');

    if (/[A-Z]/.test(password)) score++;
    else errors.push('Senha deve conter pelo menos uma letra maiúscula');

    if (/\d/.test(password)) score++;
    else errors.push('Senha deve conter pelo menos um número');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else errors.push('Senha deve conter pelo menos um caractere especial');

    if (!/\s/.test(password)) {
      if (password.length > 0) score++;
    } else {
      errors.push('Senha não pode conter espaços');
    }

    // Determinar nível de força
    const levels = [
      { score: 0, text: '', color: '' },
      { score: 1, text: 'Muito fraca', color: 'bg-red-500' },
      { score: 2, text: 'Fraca', color: 'bg-orange-500' },
      { score: 3, text: 'Regular', color: 'bg-yellow-500' },
      { score: 4, text: 'Forte', color: 'bg-blue-500' },
      { score: 5, text: 'Muito forte', color: 'bg-green-500' },
      { score: 6, text: 'Excelente', color: 'bg-green-600' },
      { score: 7, text: 'Perfeita', color: 'bg-green-700' }
    ];

    const level = levels[Math.min(score, levels.length - 1)] || levels[0];

    return {
      score,
      text: level.text,
      color: level.color,
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const updateStrength = useCallback((password: string) => {
    const newStrength = calculateStrength(password);
    setStrength(newStrength);
    return newStrength;
  }, [calculateStrength]);

  return {
    strength,
    updateStrength,
    calculateStrength
  };
}; 