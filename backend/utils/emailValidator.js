const dns = require('dns').promises;

/**
 * Valida se um email é real verificando:
 * 1. Formato válido
 * 2. Domínio existe (DNS)
 * 3. Servidor de email configurado (MX records)
 */
class EmailValidator {
  /**
   * Valida formato básico de email
   */
  static isValidFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Verifica se o domínio do email existe
   */
  static async domainExists(email) {
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;

      // Verifica registros MX (Mail Exchange)
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      // Se não encontrar MX, tenta resolver o domínio diretamente
      try {
        const domain = email.split('@')[1];
        await dns.resolve4(domain);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Lista de domínios conhecidos que sempre devem ser aceitos
   * (para evitar falsos positivos em ambientes de desenvolvimento)
   */
  static trustedDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'icloud.com',
    'protonmail.com',
    'zoho.com',
    'aol.com',
    'mail.com',
    'gmx.com',
    'yandex.com',
    'uol.com.br',
    'bol.com.br',
    'terra.com.br',
    'ig.com.br'
  ];

  /**
   * Verifica se é um domínio confiável
   */
  static isTrustedDomain(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    return this.trustedDomains.includes(domain);
  }

  /**
   * Validação completa de email
   */
  static async validate(email) {
    console.log(`📧 [EmailValidator] Validando email: ${email}`);

    // 1. Verifica formato
    if (!this.isValidFormat(email)) {
      console.log(`❌ [EmailValidator] Formato inválido: ${email}`);
      return {
        valid: false,
        reason: 'Formato de email inválido'
      };
    }

    // 2. Se for domínio confiável, aceita imediatamente
    if (this.isTrustedDomain(email)) {
      console.log(`✅ [EmailValidator] Domínio confiável: ${email}`);
      return {
        valid: true,
        reason: 'Domínio confiável'
      };
    }

    // 3. Verifica se o domínio existe
    const domainValid = await this.domainExists(email);
    if (!domainValid) {
      console.log(`❌ [EmailValidator] Domínio não existe ou não pode receber emails: ${email}`);
      return {
        valid: false,
        reason: 'Este domínio de email não existe ou não está configurado para receber mensagens'
      };
    }

    console.log(`✅ [EmailValidator] Email válido: ${email}`);
    return {
      valid: true,
      reason: 'Email válido'
    };
  }
}

module.exports = EmailValidator;
