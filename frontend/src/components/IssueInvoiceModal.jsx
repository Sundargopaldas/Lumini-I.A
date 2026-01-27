import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateCPF, validateCNPJ, validateStateRegistration, validateEmail } from '../utils/validators';
import { STATE_TAX_RATES, BRAZILIAN_STATES } from '../utils/taxRates';

const IssueInvoiceModal = ({ isOpen, onClose, onIssue, hasCertificate }) => {
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

  const [issueType, setIssueType] = useState('receipt');
  const [certStatus, setCertStatus] = useState({ configured: false, taxRegime: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.taxRegime === 'MEI') {
      setIssueType('receipt');
    } else {
      setIssueType('official');
    }
    setCertStatus({
      configured: false,
      taxRegime: user.taxRegime || ''
    });
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

    // Calculate Tax Amount
    let taxAmount = 0;
    
    // Only calculate taxes if it's an Official NF-e
    if (issueType === 'official') {
        const pis = 0.0065;
        const cofins = 0.03;
        const iss = 0.05;
        const icms = formData.state && STATE_TAX_RATES[formData.state] ? STATE_TAX_RATES[formData.state] : 0;
        const totalTaxRate = pis + cofins + iss + icms;
        taxAmount = numericValue * totalTaxRate;
    }

    onIssue({ 
        ...formData, 
        value: numericValue,
        taxAmount: taxAmount,
        clientState: formData.state,
        type: issueType // 'official' or 'receipt'
    });
    setLoading(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {issueType === 'official' ? 'Emitir NFS-e' : 'Gerar Recibo / Fatura'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors bg-gray-100 dark:bg-white/10 rounded-full p-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 pt-2 overflow-y-auto custom-scrollbar">
          
          {/* Issue Type Selector */}
          <div className="mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex">
            <button
                type="button"
                onClick={() => setIssueType('official')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    issueType === 'official' 
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
            >
                Nota Fiscal (NFS-e)
            </button>
            <button
                type="button"
                onClick={() => setIssueType('receipt')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    issueType === 'receipt' 
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
            >
                Recibo Simples
            </button>
          </div>

          {issueType === 'official' && !hasCertificate && (
             <div className="mb-6 p-4 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 flex gap-3 animate-pulse">
                 <span className="text-2xl">🚫</span>
                 <div className="flex-1">
                     <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">
                         ⚠️ CERTIFICADO DIGITAL NÃO CONFIGURADO
                     </p>
                     <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                         Sem um Certificado Digital A1 válido, <strong>não é possível emitir notas fiscais</strong>. 
                         O sistema não conseguirá enviar a nota para a Secretaria da Fazenda.
                     </p>
                     <a 
                         href="/settings?tab=fiscal" 
                         target="_blank"
                         className="inline-flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300 hover:underline"
                     >
                         → Configure seu Certificado Digital agora
                     </a>
                 </div>
             </div>
          )}
          
          {issueType === 'official' && hasCertificate && (
             <div className="mb-6 p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 flex gap-3">
                 <span className="text-xl">✅</span>
                 <div className="text-xs">
                     <p className="text-green-800 dark:text-green-200">
                         <strong>Certificado Digital Ativo!</strong> Sua nota fiscal será transmitida oficialmente para a Secretaria da Fazenda.
                     </p>
                 </div>
             </div>
          )}

          {issueType === 'receipt' && (
             <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800 flex gap-3">
                 <span className="text-xl">📄</span>
                 <p className="text-xs text-yellow-800 dark:text-yellow-200">
                     Este documento serve apenas como comprovante de recebimento e controle interno. <strong>Não possui valor fiscal.</strong>
                 </p>
             </div>
          )}

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
                <select
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                >
                  <option value="">UF</option>
                  {BRAZILIAN_STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.code}</option>
                  ))}
                </select>
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
                    <div className="grid grid-cols-4 gap-2 text-xs">
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
                        <div>
                            <span className="block text-gray-600 dark:text-gray-500">ICMS ({formData.state ? (STATE_TAX_RATES[formData.state] * 100).toFixed(1) : '0'}%)</span>
                            <span className="text-gray-800 dark:text-gray-300">
                                {(parseFloat(formData.value.replace(/[^\d,]/g, '').replace(',', '.') || 0) * (formData.state ? STATE_TAX_RATES[formData.state] : 0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
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
