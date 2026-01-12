import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 🔒 INDICADOR DE FORÇA DE SENHA
 * Mostra feedback visual em tempo real sobre a força da senha
 */
const PasswordStrengthIndicator = ({ password }) => {
  const { isDark } = useTheme();
  const [strength, setStrength] = useState(0);
  const [errors, setErrors] = useState([]);
  const [strengthLevel, setStrengthLevel] = useState('');

  useEffect(() => {
    if (!password || password.length === 0) {
      setStrength(0);
      setErrors([]);
      setStrengthLevel('');
      return;
    }

    // Validação local (simplificada) para feedback instantâneo
    const localValidation = validatePasswordLocal(password);
    setStrength(localValidation.strength);
    setErrors(localValidation.errors);
    setStrengthLevel(localValidation.strengthLevel);
  }, [password]);

  // Validação local simplificada (não precisa fazer request para cada caractere)
  const validatePasswordLocal = (pwd) => {
    const errors = [];
    let strength = 0;

    // Tamanho
    if (pwd.length < 8) {
      errors.push('Mínimo 8 caracteres');
    } else {
      strength += 20;
      if (pwd.length >= 12) strength += 10;
      if (pwd.length >= 16) strength += 10;
    }

    // Letra maiúscula
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Uma letra maiúscula');
    } else {
      strength += 15;
    }

    // Letra minúscula
    if (!/[a-z]/.test(pwd)) {
      errors.push('Uma letra minúscula');
    } else {
      strength += 15;
    }

    // Número
    if (!/[0-9]/.test(pwd)) {
      errors.push('Um número');
    } else {
      strength += 15;
    }

    // Caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push('Um caractere especial (!@#$%)');
    } else {
      strength += 15;
    }

    // Espaços
    if (/\s/.test(pwd)) {
      errors.push('Sem espaços');
      strength -= 20;
    }

    strength = Math.max(0, Math.min(100, strength));

    const strengthLevel =
      strength >= 80 ? 'Muito Forte' :
      strength >= 60 ? 'Forte' :
      strength >= 40 ? 'Média' :
      strength >= 20 ? 'Fraca' : 'Muito Fraca';

    return { strength, errors, strengthLevel };
  };

  // Cores baseadas na força
  const getStrengthColor = () => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-blue-500';
    if (strength >= 40) return 'bg-yellow-500';
    if (strength >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthTextColor = () => {
    if (strength >= 80) return 'text-green-600 dark:text-green-400';
    if (strength >= 60) return 'text-blue-600 dark:text-blue-400';
    if (strength >= 40) return 'text-yellow-600 dark:text-yellow-400';
    if (strength >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!password || password.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
          {strengthLevel}
        </span>
      </div>

      {/* Lista de requisitos */}
      {errors.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Requisitos faltando:
          </p>
          <ul className="list-disc list-inside text-red-600 dark:text-red-400 space-y-0.5">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {errors.length === 0 && strength >= 60 && (
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Senha segura!</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
