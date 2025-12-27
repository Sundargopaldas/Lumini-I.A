import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });
      setMessage('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Redefinir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Digite sua nova senha abaixo.
          </p>
        </div>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="newPassword" className="sr-only">Nova Senha</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-gray-900 bg-white/90 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Nova Senha"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" class="sr-only">Confirmar Senha</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-gray-900 bg-white/90 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Confirmar Senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading ? 'bg-purple-800 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200`}
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
            <Link to="/login" className="font-medium text-purple-300 hover:text-purple-200 transition-colors">
                Voltar para o Login
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
