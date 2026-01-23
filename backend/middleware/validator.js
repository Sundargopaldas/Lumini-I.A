/**
 * Middleware de Validação com Joi
 * 
 * Sistema de validação incremental que:
 * - NÃO quebra código existente
 * - Adiciona validação onde necessário
 * - Facilita expansão futura
 */

const Joi = require('joi');

/**
 * Middleware genérico de validação
 * @param {Object} schema - Schema Joi para validar
 * @param {String} property - 'body', 'query', 'params'
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true // Remove campos desconhecidos
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '') // Remove aspas das mensagens
      }));

      // Criar mensagem principal mais descritiva
      const mainMessage = errors.length === 1 
        ? errors[0].message 
        : `Erro de validação: ${errors.length} campo(s) inválido(s)`;

      console.error('❌ [VALIDATOR] Validation failed:', JSON.stringify({
        method: req.method,
        path: req.path,
        property,
        data: req[property],
        errors
      }, null, 2));

      return res.status(400).json({
        message: mainMessage,
        errors: errors,
        // Adicionar detalhes adicionais para facilitar debug
        ...(process.env.NODE_ENV === 'development' && {
          received: req[property],
          expected: 'Verifique os campos: ' + errors.map(e => e.field).join(', ')
        })
      });
    }

    // Substituir com valor validado e sanitizado
    req[property] = value;
    next();
  };
};

/**
 * Schemas de Validação
 */

// Auth
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username deve conter apenas letras e números',
      'string.min': 'Username deve ter no mínimo 3 caracteres',
      'string.max': 'Username deve ter no máximo 30 caracteres',
      'any.required': 'Username é obrigatório'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório'
    }),
  
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Senha deve ter no mínimo 8 caracteres',
      'any.required': 'Senha é obrigatória'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório',
      'string.empty': 'Email não pode estar vazio'
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Senha é obrigatória',
      'string.empty': 'Senha não pode estar vazia'
    })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).allow('', null).optional()
    .messages({
      'string.max': 'Nome não pode exceder 100 caracteres'
    }),
  address: Joi.string().max(200).allow('', null).optional()
    .messages({
      'string.max': 'Endereço não pode exceder 200 caracteres'
    }),
  cpfCnpj: Joi.string().max(20).allow('', null).optional()
    .messages({
      'string.max': 'CPF/CNPJ não pode exceder 20 caracteres'
    }),
  municipalRegistration: Joi.string().max(50).allow('', null).optional()
    .messages({
      'string.max': 'Inscrição Municipal não pode exceder 50 caracteres'
    }),
  taxRegime: Joi.string().valid('mei', 'simples', 'presumido', 'real').allow('', null).optional()
    .messages({
      'any.only': 'Regime tributário inválido. Valores aceitos: mei, simples, presumido, real'
    })
});

// Transactions
const createTransactionSchema = Joi.object({
  amount: Joi.alternatives()
    .try(
      Joi.number(),
      Joi.string().pattern(/^\d+(\.\d{1,2})?$/).custom((value) => parseFloat(value))
    )
    .required()
    .messages({
      'alternatives.match': 'Valor deve ser um número válido',
      'any.required': 'Valor é obrigatório'
    }),
  
  description: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Descrição deve ter no mínimo 3 caracteres',
      'string.max': 'Descrição deve ter no máximo 200 caracteres'
    }),
  
  date: Joi.date().required(),
  
  type: Joi.string()
    .valid('income', 'expense')
    .required()
    .messages({
      'any.only': 'Tipo deve ser "income" ou "expense"'
    }),
  
  source: Joi.string().max(50).optional(),
  categoryId: Joi.number().integer().optional(),
  goalId: Joi.number().integer().allow(null).optional(),
  isRecurring: Joi.boolean().optional()
});

// Goals
const createGoalSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  targetAmount: Joi.number().positive().required(),
  currentAmount: Joi.number().min(0).optional(),
  deadline: Joi.date().greater('now').required(),
  category: Joi.string().max(50).optional()
});

// Invoices
const createInvoiceSchema = Joi.object({
  borrowerName: Joi.string().min(3).max(100).required(),
  borrowerDocument: Joi.string().min(11).max(18).required(),
  borrowerEmail: Joi.string().email().optional(),
  borrowerAddress: Joi.string().max(200).optional(),
  serviceDescription: Joi.string().min(10).max(500).required(),
  amount: Joi.number().positive().required(),
  issueDate: Joi.date().optional()
});

// Pagination (query params)
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

module.exports = {
  validate,
  schemas: {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    createTransactionSchema,
    createGoalSchema,
    createInvoiceSchema,
    paginationSchema
  }
};
