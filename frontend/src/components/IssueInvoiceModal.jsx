import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateCPF, validateCNPJ, validateStateRegistration, validateEmail } from '../utils/validators';

const IssueInvoiceModal = ({ isOpen, onClose, onIssue }) => {
  const [loading, setLoading] = useState(false);
  const initialFormState = {
    clientName: '',
    document: '', // CPF/CNPJ
    stateRegistration: '',
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors({});
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

  const maskCPF_CNPJ = (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
        return clean
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    } else {
        return clean
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const handleDocumentChange = (e) => {
      const value = e.target.value;
      setFormData({ ...formData, document: maskCPF_CNPJ(value) });
  };

  const maskCEP = (value) => {
      return value
          .replace(/\D/g, '')
          .replace(/^(\d{5})(\d)/, '$1-$2')
          .replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    const newErrors = {};
    const doc = formData.document.replace(/\D/g, '');
    
    if (doc.length === 11) {
        if (!validateCPF(doc)) {
            newErrors.document = 'CPF inválido';
        }
    } else if (doc.length === 14) {
        if (!validateCNPJ(doc)) {
            newErrors.document = 'CNPJ inválido';
        }
    } else {
        newErrors.document = 'Documento inválido (CPF ou CNPJ)';
    }

    if (formData.stateRegistration) {
        if (!validateStateRegistration(formData.stateRegistration)) {
            newErrors.stateRegistration = 'Inscrição Estadual inválida';
        }
    }

    if (!validateEmail(formData.email)) {
        newErrors.email = 'Email inválido';
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    
    setErrors({});
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
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Emitir NFS-e</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-white/10 rounded-full p-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 pt-2 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Dados do Tomador</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Razão Social</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Empresa Cliente Ltda"
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    required
                    className={`w-full bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.document ? 'border-red-500' : 'border-gray-300 dark:border-slate-700'}`}
                    placeholder="00.000.000/0000-00"
                    value={formData.document}
                    onChange={(e) => {
                        handleDocumentChange(e);
                        if (errors.document) setErrors({...errors, document: null});
                    }}
                    maxLength="18"
                  />
                  {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    className={`w-full bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.stateRegistration ? 'border-red-500' : 'border-gray-300 dark:border-slate-700'}`}
                    placeholder="Ex: 123.456.789.111"
                    value={formData.stateRegistration}
                    onChange={(e) => {
                        setFormData({...formData, stateRegistration: e.target.value.replace(/[^0-9.-]/g, '')});
                        if (errors.stateRegistration) setErrors({...errors, stateRegistration: null});
                    }}
                  />
                  {errors.stateRegistration && <p className="text-red-500 text-xs mt-1">{errors.stateRegistration}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className={`w-full bg-white dark:bg-slate-800 border rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-700'}`}
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (errors.email) setErrors({...errors, email: null});
                  }}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={e => setFormData({...formData, cep: maskCEP(e.target.value)})}
                  maxLength="9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Rua, Número"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Bairro"
                  value={formData.neighborhood}
                  onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="UF"
                  maxLength="2"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                />
              </div>
            </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-white/10 my-4"></div>

            {/* Service Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Serviço</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição do Serviço</label>
                <textarea
                  required
                  rows="3"
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Desenvolvimento de Software..."
                  value={formData.serviceDescription}
                  onChange={e => setFormData({...formData, serviceDescription: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor do Serviço</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-right font-mono text-lg"
                    placeholder="R$ 0,00"
                    value={formData.value}
                    onChange={handleCurrencyChange}
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-purple-600 rounded bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-700"
                      checked={formData.issRetained}
                      onChange={e => setFormData({...formData, issRetained: e.target.checked})}
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">ISS Retido?</span>
                  </label>
                </div>
              </div>

              {/* Tax Simulation Info Box */}
              {formData.value && (
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-200 dark:border-white/5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Simulação de Impostos (Estimado)</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <span className="block text-gray-600 dark:text-gray-500">PIS (0,65%)</span>
                            <span className="text-gray-800 dark:text-gray-300">
                                {(parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.') || 0) * 0.0065).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                            </span>
                        </div>
                        <div>
                            <span className="block text-gray-600 dark:text-gray-500">COFINS (3%)</span>
                            <span className="text-gray-800 dark:text-gray-300">
                                {(parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.') || 0) * 0.03).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                            </span>
                        </div>
                        <div>
                            <span className="block text-gray-600 dark:text-gray-500">ISS (5%)</span>
                            <span className="text-gray-800 dark:text-gray-300">
                                {(parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.') || 0) * 0.05).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                            </span>
                        </div>
                    </div>
                </div>
              )}
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
