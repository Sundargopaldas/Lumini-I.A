/**
 * 🔒 VALIDADOR DE SENHAS FORTES
 * Garante que senhas atendem aos requisitos mínimos de segurança
 */

/**
 * Valida se a senha atende aos requisitos de segurança
 * @param {string} password - Senha a ser validada
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePassword(password) {
    const errors = [];

    // Requisito 1: Tamanho mínimo
    if (password.length < 8) {
        errors.push('Senha deve ter no mínimo 8 caracteres');
    }

    // Requisito 2: Pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    // Requisito 3: Pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    // Requisito 4: Pelo menos um número
    if (!/[0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um número');
    }

    // Requisito 5: Pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&* etc)');
    }

    // Requisito 6: Não pode ter espaços
    if (/\s/.test(password)) {
        errors.push('Senha não pode conter espaços');
    }

    // Requisito 7: Senhas comuns (blacklist)
    const commonPasswords = [
        'password', 'senha', '12345678', 'qwerty', 'abc123',
        'password123', 'admin123', '123456789', 'letmein', 'welcome'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Senha muito comum. Por favor, escolha uma senha mais segura');
    }

    return {
        valid: errors.length === 0,
        errors: errors,
        strength: calculateStrength(password)
    };
}

/**
 * Calcula a força da senha (0-100)
 * @param {string} password
 * @returns {number}
 */
function calculateStrength(password) {
    let strength = 0;

    // Comprimento
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;

    // Complexidade
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;

    return Math.min(100, strength);
}

/**
 * Gera uma sugestão de senha forte
 * @returns {string}
 */
function generateStrongPassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}';

    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Preencher o resto (mínimo 12 caracteres)
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = {
    validatePassword,
    calculateStrength,
    generateStrongPassword
};
