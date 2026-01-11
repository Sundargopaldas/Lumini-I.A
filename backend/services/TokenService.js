/**
 * Serviço de Tokens
 * 
 * Gerencia Access Tokens e Refresh Tokens
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

/**
 * Gera um Access Token (JWT padrão - mantém compatibilidade)
 */
const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET,
    { expiresIn: '24h' } // Pode reduzir para 15min com refresh tokens
  );
};

/**
 * Gera um Refresh Token (opaco)
 */
const generateRefreshToken = async (userId) => {
  // Gerar token único
  const token = crypto.randomBytes(64).toString('hex');
  
  // Calcular expiração (30 dias)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Salvar no banco
  await RefreshToken.create({
    token,
    userId,
    expiresAt
  });

  return token;
};

/**
 * Verifica e renova tokens
 */
const refreshAccessToken = async (refreshToken) => {
  // Buscar refresh token no banco
  const tokenRecord = await RefreshToken.findOne({
    where: { token: refreshToken }
  });

  if (!tokenRecord) {
    throw new Error('Invalid refresh token');
  }

  if (tokenRecord.isRevoked) {
    throw new Error('Token revoked');
  }

  if (new Date() > tokenRecord.expiresAt) {
    throw new Error('Refresh token expired');
  }

  // Gerar novo access token
  const newAccessToken = generateAccessToken(tokenRecord.userId);

  return {
    accessToken: newAccessToken,
    refreshToken: refreshToken // Mantém o mesmo (pode rotacionar se quiser)
  };
};

/**
 * Revoga um refresh token
 */
const revokeRefreshToken = async (refreshToken) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { token: refreshToken } }
  );
};

/**
 * Revoga todos os tokens de um usuário (logout de todos dispositivos)
 */
const revokeAllUserTokens = async (userId) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId } }
  );
};

/**
 * Limpa tokens expirados (chamar periodicamente)
 */
const cleanExpiredTokens = async () => {
  await RefreshToken.destroy({
    where: {
      expiresAt: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanExpiredTokens
};
