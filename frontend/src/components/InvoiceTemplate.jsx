import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const InvoiceTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [issuer, setIssuer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [invoiceRes, userRes] = await Promise.all([
        api.get(`/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setInvoice(invoiceRes.data);
      setIssuer(userRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar nota:', error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando nota fiscal...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !issuer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nota fiscal não encontrada</p>
          <button onClick={() => navigate('/invoices')} className="mt-4 text-blue-600 hover:underline">
            Voltar para Notas Fiscais
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0">
      {/* Botões de ação (não imprime) */}
      <div className="max-w-4xl mx-auto mb-4 px-4 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Voltar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>

      {/* Nota Fiscal */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        {/* Cabeçalho */}
        <div className="border-b-4 border-blue-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NOTA FISCAL DE SERVIÇO ELETRÔNICA</h1>
              <p className="text-sm text-gray-600 mt-1">NFS-e {invoice.type === 'official' ? '(OFICIAL)' : '(RECIBO)'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">Nº {String(invoice.originalId).padStart(6, '0')}</p>
              <p className="text-sm text-gray-600">Série: 001</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(invoice.date)}</p>
            </div>
          </div>
        </div>

        {/* Dados do Prestador */}
        <div className="border-b border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">Prestador de Serviços</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{issuer.name || issuer.email}</p>
              <p className="text-xs text-gray-600 mt-1">
                {issuer.cpfCnpj ? `CPF/CNPJ: ${issuer.cpfCnpj}` : 'Documento não cadastrado'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Endereço não cadastrado</p>
              <p className="text-xs text-gray-600">{issuer.email}</p>
            </div>
          </div>
        </div>

        {/* Dados do Tomador */}
        <div className="border-b border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">Tomador de Serviços</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{invoice.client}</p>
              <p className="text-xs text-gray-600 mt-1">
                {invoice.clientDocument || 'Documento não informado'}
              </p>
              {invoice.clientStateRegistration && (
                <p className="text-xs text-gray-600">IE: {invoice.clientStateRegistration}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">{invoice.clientAddress}</p>
              {invoice.clientEmail && (
                <p className="text-xs text-gray-600 mt-1">{invoice.clientEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Descrição do Serviço */}
        <div className="border-b border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">Descrição dos Serviços</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{invoice.service}</p>
          </div>
        </div>

        {/* Valores */}
        <div className="border-b-2 border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase">Valores</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor dos Serviços</span>
              <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
            </div>
            
            {invoice.taxAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">(-) Deduções / Descontos</span>
                  <span className="text-gray-900">R$ 0,00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base de Cálculo</span>
                  <span className="text-gray-900">{formatCurrency(invoice.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Valor dos Impostos (estimado)</span>
                  <span className="text-red-600">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              </>
            )}

            <div className="border-t-2 border-gray-400 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-base font-bold text-gray-900">VALOR TOTAL</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(invoice.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Status da Nota</p>
              <p className={`text-sm font-bold mt-1 ${
                invoice.status === 'issued' ? 'text-green-600' : 
                invoice.status === 'error' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {invoice.status === 'issued' ? '✓ EMITIDA' : 
                 invoice.status === 'error' ? '✗ ERRO' : 
                 '⏳ PROCESSANDO'}
              </p>
            </div>
            {invoice.type === 'official' && (
              <div className="text-right">
                <p className="text-xs text-gray-600">Ambiente</p>
                <p className="text-sm font-bold text-blue-600 mt-1">SANDBOX - HOMOLOGAÇÃO</p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t border-gray-300 p-4 bg-gray-100">
          <p className="text-xs text-gray-600 text-center">
            Documento gerado por <span className="font-semibold">Lumini I.A</span> - Gestão Financeira Inteligente
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            https://lumini-i-a.fly.dev
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
