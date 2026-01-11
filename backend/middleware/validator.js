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
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Erro de validação',
        errors
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
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  address: Joi.string().max(200).optional(),
  cpfCnpj: Joi.string().max(20).optional(),
  municipalRegistration: Joi.string().max(50).optional(),
  taxRegime: Joi.string().valid('mei', 'simples', 'presumido', 'real').optional()
});

// Transactions
const createTransactionSchema = Joi.object({
  amount: Joi.number()
    .required()
    .messages({
      'number.base': 'Valor deve ser um número',
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
  goalId: Joi.number().integer().optional(),
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
