/**
 * Testes de Autenticação
 * 
 * Para rodar: npm test
 */

const request = require('supertest');
const app = require('../server'); // Assumindo que server.js exporta app

describe('Auth Routes', () => {
  
  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário com dados válidos', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser' + Date.now(),
          email: `test${Date.now()}@test.com`,
          password: 'Test@123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('deve rejeitar registro sem email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test@123'
        });

      expect(res.statusCode).toBe(400);
    });

    it('deve rejeitar senha fraca', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@test.com',
          password: '123' // Senha muito curta
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve rejeitar login sem credenciais', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('deve rejeitar email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-invalido',
          password: 'Test@123'
        });

      expect(res.statusCode).toBe(400);
    });
  });
});

describe('Password Validator', () => {
  const { validatePassword, isCommonPassword } = require('../utils/passwordValidator');

  it('deve validar senha forte', () => {
    const result = validatePassword('Test@123');
    expect(result.isValid).toBe(true);
  });

  it('deve rejeitar senha curta', () => {
    const result = validatePassword('Test@1');
    expect(result.isValid).toBe(false);
  });

  it('deve rejeitar senha sem maiúscula', () => {
    const result = validatePassword('test@123');
    expect(result.isValid).toBe(false);
  });

  it('deve rejeitar senha comum', () => {
    const result = isCommonPassword('12345678');
    expect(result).toBe(true);
  });
});
