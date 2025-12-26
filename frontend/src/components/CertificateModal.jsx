import React, { useState } from 'react';
import CustomAlert from './CustomAlert';

const CertificateModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    inscricaoMunicipal: '',
    password: '',
    file: null
  });
  
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API validation of certificate
    setTimeout(() => {
        setLoading(false);
        onSave({
            ...formData,
            fileName: formData.file ? formData.file.name : 'certificado.pfx',
            status: 'active'
        });
        onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        <div className="mb-6 flex items-center gap-3">
            <div className="bg-purple-600/20 p-3 rounded-lg text-purple-400 text-2xl">🔐</div>
            <div>
                <h2 className="text-xl font-bold text-white">Configurar Certificado Digital</h2>
                <p className="text-sm text-gray-400">Necessário para assinar e transmitir as notas (A1).</p>
            </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mb-6 text-xs text-blue-200 leading-relaxed">
            ℹ️ <strong>Importante:</strong> O Certificado Digital A1 é um arquivo (.pfx) que você deve adquirir com uma Autoridade Certificadora (ex: Serasa, Certisign). O Lumini armazena seu certificado com criptografia de ponta apenas para assinar suas notas fiscais automaticamente.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">CNPJ</label>
                    <input 
                        type="text" 
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="00.000.000/0001-00"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Inscrição Municipal</label>
                    <input 
                        type="text" 
                        value={formData.inscricaoMunicipal}
                        onChange={(e) => setFormData({...formData, inscricaoMunicipal: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Ex: 123456-7"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Razão Social</label>
                <input 
                    type="text" 
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Sua Empresa LTDA"
                    required
                />
            </div>

            <div className="p-4 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-center group cursor-pointer relative">
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
                        <span className="text-green-400 font-medium text-sm">{formData.file.name}</span>
                    ) : (
                        <span className="text-gray-400 text-sm group-hover:text-white">Arraste seu arquivo .pfx ou clique aqui</span>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Senha do Certificado</label>
                <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
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
