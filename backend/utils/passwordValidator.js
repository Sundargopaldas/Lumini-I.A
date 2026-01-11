/**
 * Password Validation Helper
 * Ensures strong passwords for security
 */

const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { isValid: false, message: 'Senha é obrigatória' };
  }
  
  if (password.length < 8) {
    errors.push('mínimo de 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('pelo menos um número');
  }
  
  // Optional: special characters
  // if (!/[!@#$%^&*]/.test(password)) {
  //   errors.push('pelo menos um caractere especial (!@#$%^&*)');
  // }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      message: `A senha precisa ter ${errors.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Check for common weak passwords
 */
const isCommonPassword = (password) => {
  const commonPasswords = [
    '12345678', 'password', 'Password1', 'qwerty123', 'abc123456',
    'senha123', 'Senha123', '11111111', '123456789'
  ];
  
  return commonPasswords.includes(password);
};

module.exports = {
  validatePassword,
  isCommonPassword
};
