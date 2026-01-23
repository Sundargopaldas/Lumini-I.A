/**
 * 🛡️ UTILITÁRIO DE TRATAMENTO DE ERROS
 * Centraliza o tratamento de erros HTTP, especialmente 400 (validação)
 */

/**
 * Extrai mensagem de erro de uma resposta HTTP
 * @param {Error} error - Erro do axios
 * @returns {Object} { title, message, errors }
 */
export const extractErrorMessage = (error) => {
  // Erro de rede
  if (!error.response) {
    return {
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
      errors: []
    };
  }

  const { status, data } = error.response;

  // Erro 400 - Bad Request (Validação)
  if (status === 400) {
    const errors = data.errors || [];
    let message = data.message || 'Erro de validação';
    
    // Se houver múltiplos erros, criar mensagem mais descritiva
    if (errors.length > 0) {
      if (errors.length === 1) {
        message = errors[0].message || message;
      } else {
        const errorList = errors
          .map(err => `• ${err.field || ''}: ${err.message || ''}`)
          .filter(item => item !== '• :')
          .join('\n');
        message = `${message}\n\n${errorList}`;
      }
    }

    return {
      title: 'Erro de Validação',
      message: message,
      errors: errors
    };
  }

  // Erro 401 - Unauthorized
  if (status === 401) {
    return {
      title: 'Não Autorizado',
      message: 'Sua sessão expirou. Por favor, faça login novamente.',
      errors: []
    };
  }

  // Erro 403 - Forbidden
  if (status === 403) {
    return {
      title: 'Acesso Negado',
      message: data.message || 'Você não tem permissão para realizar esta ação.',
      errors: []
    };
  }

  // Erro 404 - Not Found
  if (status === 404) {
    return {
      title: 'Não Encontrado',
      message: 'O recurso solicitado não foi encontrado.',
      errors: []
    };
  }

  // Erro 500+ - Server Error
  if (status >= 500) {
    return {
      title: 'Erro do Servidor',
      message: 'Ocorreu um erro no servidor. Nossa equipe foi notificada. Tente novamente mais tarde.',
      errors: []
    };
  }

  // Outros erros
  return {
    title: 'Erro',
    message: data.message || `Erro ${status}: ${error.message || 'Erro desconhecido'}`,
    errors: data.errors || []
  };
};

/**
 * Formata erros de validação para exibição
 * @param {Array} errors - Array de erros
 * @returns {String} Mensagem formatada
 */
export const formatValidationErrors = (errors) => {
  if (!errors || errors.length === 0) return '';
  
  return errors
    .map(err => {
      const field = err.field || 'campo';
      const message = err.message || 'inválido';
      return `• ${field}: ${message}`;
    })
    .join('\n');
};
