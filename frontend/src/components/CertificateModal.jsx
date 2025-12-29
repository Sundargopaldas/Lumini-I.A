import React, { useState } from 'react';
import CustomAlert from './CustomAlert';
import api from '../services/api';

const CertificateModal = ({ isOpen, onClose, onSave, certificate }) => {
  const [formData, setFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    inscricaoMunicipal: '',
    password: '',
    file: null
  });
  
  const [loading, setLoading] = useState(false);

  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info', onConfirm) => {
    setAlertState({ isOpen: true, title, message, type, onConfirm });
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleRemove = () => {
    showAlert('Remover Certificado', 'Tem certeza que deseja remover o certificado digital?', 'confirm', async () => {
        setLoading(true);
        try {
            await api.delete('/certificates');
            onSave(null); // Clear certificate in parent
            onClose();
        } catch (error) {
            console.error('Error removing certificate:', error);
            showAlert('Erro', 'Erro ao remover certificado.', 'error');
        } finally {
            setLoading(false);
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const data = new FormData();
        data.append('cnpj', formData.cnpj);
        data.append('razaoSocial', formData.razaoSocial);
        data.append('inscricaoMunicipal', formData.inscricaoMunicipal);
        data.append('password', formData.password);
        if (formData.file) {
            data.append('file', formData.file);
        }

        const response = await api.post('/certificates', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        onSave({
            ...response.data,
            fileName: formData.file ? formData.file.name : 'certificado.pfx',
            status: 'active'
        });
        
        onClose();
    } catch (error) {
        console.error('Error uploading certificate:', error);
        showAlert('Erro', 'Erro ao salvar certificado. Verifique os dados e tente novamente.', 'error');
    } finally {
        setLoading(false);
    }
  };

  if (certificate) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 transition-all">
          <CustomAlert 
            isOpen={alertState.isOpen}
            onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
            onConfirm={alertState.onConfirm}
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative transition-colors">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center space-y-4">
                <div className="bg-green-500/10 dark:bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors">
                    <span className="text-3xl">✅</span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Certificado Conectado</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm transition-colors">O certificado digital está ativo e pronto para uso.</p>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-left space-y-3 border border-slate-200 dark:border-slate-700 transition-colors">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-gray-500 uppercase transition-colors">Razão Social</p>
                        <p className="text-slate-900 dark:text-white font-medium transition-colors">{certificate.razaoSocial}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-gray-500 uppercase transition-colors">CNPJ</p>
                            <p className="text-slate-900 dark:text-white font-medium transition-colors">{certificate.cnpj}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-gray-500 uppercase transition-colors">Status</p>
                            <p className="text-green-600 dark:text-green-400 font-bold text-sm bg-green-100 dark:bg-green-500/10 inline-block px-2 py-0.5 rounded transition-colors">ATIVO</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition-colors"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={handleRemove}
                        disabled={loading}
                        className="flex-1 bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-600/50 py-2 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Removendo...' : 'Desconectar Certificado'}
                    </button>
                </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm}
      />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 transition-colors">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <div className="mb-6 flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-600/20 p-3 rounded-lg text-purple-600 dark:text-purple-400 text-2xl transition-colors">🔐</div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Configurar Certificado Digital</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors">Necessário para assinar e transmitir as notas (A1).</p>
            </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3 rounded-lg mb-6 text-xs text-blue-800 dark:text-blue-200 leading-relaxed transition-colors">
            ℹ️ <strong>Importante:</strong> O Certificado Digital A1 é um arquivo (.pfx) que você deve adquirir com uma Autoridade Certificadora (ex: Serasa, Certisign). O Lumini armazena seu certificado com criptografia de ponta apenas para assinar suas notas fiscais automaticamente.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 transition-colors">CNPJ</label>
                    <input 
                        type="text" 
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        placeholder="00.000.000/0001-00"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 transition-colors">Inscrição Municipal</label>
                    <input 
                        type="text" 
                        value={formData.inscricaoMunicipal}
                        onChange={(e) => setFormData({...formData, inscricaoMunicipal: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        placeholder="Ex: 123456-7"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 transition-colors">Razão Social</label>
                <input 
                    type="text" 
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                    placeholder="Sua Empresa LTDA"
                    required
                />
            </div>

            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center group cursor-pointer relative">
                <input 
                    type="file" 
                    accept=".pfx,.p12"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                />
                <div className="space-y-2">
                    <span className="text-2xl block">📂</span>
                    {formData.file ? (
                        <span className="text-green-600 dark:text-green-400 font-medium text-sm transition-colors">{formData.file.name}</span>
                    ) : (
                        <span className="text-slate-500 dark:text-gray-400 text-sm group-hover:text-slate-700 dark:group-hover:text-white transition-colors">Arraste seu arquivo .pfx ou clique aqui</span>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1 transition-colors">Senha do Certificado</label>
                <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                    placeholder="••••••••"
                    required
                />
            </div>

            <button 
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading ? 'bg-purple-600/50 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20'}`}
            >
                {loading ? 'Validando Certificado...' : 'Salvar e Conectar'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default CertificateModal;
