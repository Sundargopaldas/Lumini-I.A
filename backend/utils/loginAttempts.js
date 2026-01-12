/**
 * 🔒 SISTEMA DE CONTROLE DE TENTATIVAS DE LOGIN
 * Bloqueia contas após múltiplas tentativas falhadas
 */

const loginAttempts = new Map(); // Em produção, usar Redis ou banco de dados

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos

/**
 * Registra uma tentativa de login falhada
 * @param {string} identifier - Email ou IP
 * @returns {Object} { blocked: boolean, remainingAttempts: number, blockedUntil: Date|null }
 */
function recordFailedAttempt(identifier) {
    const now = Date.now();
    let record = loginAttempts.get(identifier);

    if (!record) {
        record = {
            attempts: [],
            blockedUntil: null
        };
    }

    // Verificar se está bloqueado
    if (record.blockedUntil && record.blockedUntil > now) {
        const remainingTime = Math.ceil((record.blockedUntil - now) / 60000); // minutos
        return {
            blocked: true,
            remainingAttempts: 0,
            blockedUntil: new Date(record.blockedUntil),
            remainingMinutes: remainingTime
        };
    }

    // Limpar tentativas antigas (fora da janela de tempo)
    record.attempts = record.attempts.filter(attempt => now - attempt < ATTEMPT_WINDOW);

    // Adicionar nova tentativa
    record.attempts.push(now);

    // Verificar se deve bloquear
    if (record.attempts.length >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_DURATION;
        record.attempts = []; // Limpar tentativas após bloquear
        
        loginAttempts.set(identifier, record);
        
        console.log(`🔒 [SECURITY] Conta bloqueada: ${identifier} (${MAX_ATTEMPTS} tentativas falhadas)`);
        
        return {
            blocked: true,
            remainingAttempts: 0,
            blockedUntil: new Date(record.blockedUntil),
            remainingMinutes: BLOCK_DURATION / 60000
        };
    }

    loginAttempts.set(identifier, record);

    const remaining = MAX_ATTEMPTS - record.attempts.length;
    console.log(`⚠️  [SECURITY] Tentativa falhada para ${identifier}. Restam ${remaining} tentativas.`);

    return {
        blocked: false,
        remainingAttempts: remaining,
        blockedUntil: null
    };
}

/**
 * Verifica se um identificador está bloqueado
 * @param {string} identifier
 * @returns {Object} { blocked: boolean, blockedUntil: Date|null }
 */
function isBlocked(identifier) {
    const record = loginAttempts.get(identifier);
    
    if (!record || !record.blockedUntil) {
        return { blocked: false, blockedUntil: null };
    }

    const now = Date.now();
    
    if (record.blockedUntil > now) {
        const remainingTime = Math.ceil((record.blockedUntil - now) / 60000);
        return {
            blocked: true,
            blockedUntil: new Date(record.blockedUntil),
            remainingMinutes: remainingTime
        };
    }

    // Desbloqueado (tempo expirou)
    record.blockedUntil = null;
    record.attempts = [];
    loginAttempts.set(identifier, record);
    
    return { blocked: false, blockedUntil: null };
}

/**
 * Limpa as tentativas de login após sucesso
 * @param {string} identifier
 */
function clearAttempts(identifier) {
    loginAttempts.delete(identifier);
    console.log(`✅ [SECURITY] Tentativas limpas para ${identifier}`);
}

/**
 * Limpa bloqueios expirados periodicamente
 */
function cleanupExpiredBlocks() {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, record] of loginAttempts.entries()) {
        if (record.blockedUntil && record.blockedUntil < now) {
            loginAttempts.delete(identifier);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 [SECURITY] Limpeza automática: ${cleaned} bloqueios expirados removidos`);
    }
}

// Limpar bloqueios a cada 5 minutos
setInterval(cleanupExpiredBlocks, 5 * 60 * 1000);

module.exports = {
    recordFailedAttempt,
    isBlocked,
    clearAttempts,
    MAX_ATTEMPTS,
    BLOCK_DURATION
};
