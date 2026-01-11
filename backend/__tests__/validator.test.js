/**
 * Testes de Validação Joi
 */

const { schemas } = require('../middleware/validator');

describe('Joi Validation Schemas', () => {
  
  describe('registerSchema', () => {
    it('deve aceitar dados válidos', () => {
      const { error } = schemas.registerSchema.validate({
        username: 'testuser',
        email: 'test@test.com',
        password: 'Test@123'
      });
      
      expect(error).toBeUndefined();
    });

    it('deve rejeitar username muito curto', () => {
      const { error } = schemas.registerSchema.validate({
        username: 'ab',
        email: 'test@test.com',
        password: 'Test@123'
      });
      
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('username');
    });

    it('deve rejeitar email inválido', () => {
      const { error } = schemas.registerSchema.validate({
        username: 'testuser',
        email: 'email-invalido',
        password: 'Test@123'
      });
      
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('email');
    });
  });

  describe('createTransactionSchema', () => {
    it('deve aceitar transação válida', () => {
      const { error } = schemas.createTransactionSchema.validate({
        amount: 100.50,
        description: 'Teste de transação',
        date: new Date(),
        type: 'income'
      });
      
      expect(error).toBeUndefined();
    });

    it('deve rejeitar amount não numérico', () => {
      const { error } = schemas.createTransactionSchema.validate({
        amount: 'cem',
        description: 'Teste',
        date: new Date(),
        type: 'income'
      });
      
      expect(error).toBeDefined();
    });

    it('deve rejeitar type inválido', () => {
      const { error } = schemas.createTransactionSchema.validate({
        amount: 100,
        description: 'Teste',
        date: new Date(),
        type: 'invalido'
      });
      
      expect(error).toBeDefined();
    });
  });
});
