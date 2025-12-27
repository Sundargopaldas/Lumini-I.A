import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const IssueInvoiceModal = ({ isOpen, onClose, onIssue }) => {
  const [loading, setLoading] = useState(false);
  const initialFormState = {
    clientName: '',
    document: '', // CPF/CNPJ
    email: '',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    serviceDescription: '',
    value: '',
    issRetained: false
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (value) => {
    if (!value) return '';
    // Removes non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    // Converts to number and divides by 100 to account for cents
    const amount = Number(numericValue) / 100;
    // Formats to BRL
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, value: formatCurrency(value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean currency value to float before sending
    let numericValue = 0;
    if (formData.value) {
        numericValue = parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.'));
    }
    
    if (isNaN(numericValue)) numericValue = 0;

    onIssue({ ...formData, value: numericValue });
    setLoading(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-white">Emitir NFS-e</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors bg-white/10 rounded-full p-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 pt-2 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Dados do Tomador</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome / Razão Social</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Empresa Cliente Ltda"
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="00.000.000/0000-00"
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">CEP</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={e => setFormData({...formData, cep: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Rua, Número"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bairro</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Bairro"
                  value={formData.neighborhood}
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="UF"
                  maxLength="2"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                />
              </div>
            </div>
            </div>

            <div className="h-px bg-white/10 my-4"></div>

            {/* Service Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Serviço</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descrição do Serviço</label>
                <textarea
                  required
                  rows="3"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Desenvolvimento de Software..."
                  value={formData.serviceDescription}
                  onChange={e => setFormData({...formData, serviceDescription: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valor do Serviço</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-right font-mono text-lg"
                    placeholder="R$ 0,00"
                    value={formData.value}
                    onChange={handleCurrencyChange}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-purple-600 rounded bg-slate-800 border-slate-700"
                      checked={formData.issRetained}
                      onChange={e => setFormData({...formData, issRetained: e.target.checked})}
                    />
                    <span className="text-gray-300 text-sm">ISS Retido?</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span> <span>Emitir Nota Fiscal</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                A nota será processada e enviada por e-mail em até 5 minutos.
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IssueInvoiceModal;
