import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
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
        <div className="border-b-4 border-blue-600 p-6 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">NOTA FISCAL DE SERVIÇO ELETRÔNICA</h1>
              <p className="text-sm text-gray-600 mt-1">NFS-e {invoice.type === 'official' ? '(OFICIAL)' : '(RECIBO)'}</p>
              {invoice.verificationCode && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-xs text-gray-600 font-semibold">CÓDIGO DE VERIFICAÇÃO</p>
                  <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">{invoice.verificationCode}</p>
                </div>
              )}
            </div>
            <div className="text-right ml-6">
              <p className="text-3xl font-bold text-blue-600">Nº {String(invoice.number || invoice.originalId).padStart(7, '0')}</p>
              <p className="text-sm text-gray-600">Série: 001</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(invoice.issueDate || invoice.date)}</p>
            </div>
          </div>
        </div>

        {/* Dados do Prestador */}
        <div className="border-b border-gray-300 p-6 bg-blue-50">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">📋 Prestador de Serviços</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-base font-bold text-gray-900">{invoice.providerName || issuer.name || issuer.email}</p>
              <p className="text-xs text-gray-600 mt-1">
                {invoice.providerDocument || issuer.cpfCnpj || 'CPF/CNPJ: Não informado'}
              </p>
              {invoice.providerMunicipalRegistration && (
                <p className="text-xs text-gray-600">IM: {invoice.providerMunicipalRegistration}</p>
              )}
              {invoice.cnae && (
                <p className="text-xs text-gray-600">CNAE: {invoice.cnae}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">{invoice.providerAddress || 'Endereço não cadastrado'}</p>
              <p className="text-xs text-gray-600 mt-1">{invoice.providerEmail || issuer.email}</p>
              {invoice.providerPhone && (
                <p className="text-xs text-gray-600">Tel: {invoice.providerPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dados do Tomador */}
        <div className="border-b border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">👤 Tomador de Serviços</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-base font-bold text-gray-900">{invoice.borrowerName || invoice.client}</p>
              <p className="text-xs text-gray-600 mt-1">
                {invoice.borrowerDocument || invoice.clientDocument || 'CPF/CNPJ: Não informado'}
              </p>
              {(invoice.borrowerStateRegistration || invoice.clientStateRegistration) && (
                <p className="text-xs text-gray-600">IE: {invoice.borrowerStateRegistration || invoice.clientStateRegistration}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">{invoice.borrowerAddress || invoice.clientAddress || 'Endereço não informado'}</p>
              {(invoice.borrowerEmail || invoice.clientEmail) && (
                <p className="text-xs text-gray-600 mt-1">{invoice.borrowerEmail || invoice.clientEmail}</p>
              )}
              {(invoice.borrowerPhone || invoice.clientPhone) && (
                <p className="text-xs text-gray-600">Tel: {invoice.borrowerPhone || invoice.clientPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Informações Adicionais da Nota */}
        {(invoice.operationNature || invoice.taxRegime || invoice.serviceLocation) && (
          <div className="border-b border-gray-300 p-6 bg-gray-50">
            <div className="grid grid-cols-3 gap-4 text-xs">
              {invoice.operationNature && (
                <div>
                  <p className="text-gray-600 font-semibold">Natureza da Operação:</p>
                  <p className="text-gray-900">{invoice.operationNature}</p>
                </div>
              )}
              {invoice.taxRegime && (
                <div>
                  <p className="text-gray-600 font-semibold">Regime Tributário:</p>
                  <p className="text-gray-900">{invoice.taxRegime}</p>
                </div>
              )}
              {invoice.serviceLocation && (
                <div>
                  <p className="text-gray-600 font-semibold">Local de Prestação:</p>
                  <p className="text-gray-900">{invoice.serviceLocation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Descrição do Serviço */}
        <div className="border-b border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">📝 Discriminação dos Serviços</h2>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {invoice.serviceDescription || invoice.service || 'Descrição não informada'}
            </p>
          </div>
          {invoice.serviceCode && (
            <p className="text-xs text-gray-600 mt-2">
              Código do Serviço: <span className="font-semibold">{invoice.serviceCode}</span>
            </p>
          )}
        </div>

        {/* Valores e Impostos */}
        <div className="border-b-2 border-gray-300 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase">Valores e Tributos</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna Esquerda - Valores */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor dos Serviços</span>
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
              </div>
              
              {invoice.deductions > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">(-) Deduções</span>
                  <span className="text-red-600">{formatCurrency(invoice.deductions)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base de Cálculo</span>
                <span className="text-gray-900">{formatCurrency(invoice.amount - (invoice.deductions || 0))}</span>
              </div>
            </div>

            {/* Coluna Direita - Impostos */}
            <div className="space-y-2 border-l pl-6">
              <p className="text-xs font-bold text-gray-700 mb-2">IMPOSTOS RETIDOS</p>
              {invoice.issAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">ISS ({invoice.issRate || '2,00'}%)</span>
                  <span className="text-red-600">{formatCurrency(invoice.issAmount)}</span>
                </div>
              )}
              {invoice.irAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">IR</span>
                  <span className="text-red-600">{formatCurrency(invoice.irAmount)}</span>
                </div>
              )}
              {invoice.pisAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">PIS</span>
                  <span className="text-red-600">{formatCurrency(invoice.pisAmount)}</span>
                </div>
              )}
              {invoice.cofinsAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">COFINS</span>
                  <span className="text-red-600">{formatCurrency(invoice.cofinsAmount)}</span>
                </div>
              )}
              {invoice.csllAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">CSLL</span>
                  <span className="text-red-600">{formatCurrency(invoice.csllAmount)}</span>
                </div>
              )}
              {invoice.inssAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">INSS</span>
                  <span className="text-red-600">{formatCurrency(invoice.inssAmount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-xs font-semibold pt-1 border-t">
                  <span className="text-gray-700">Total Impostos</span>
                  <span className="text-red-600">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t-2 border-gray-400 pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">VALOR LÍQUIDO</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.amount - (invoice.taxAmount || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code e Verificação */}
        {invoice.verificationCode && (
          <div className="border-b border-gray-300 p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase">Verificação e Autenticidade</h2>
            <div className="flex items-center justify-between gap-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white border-2 border-gray-300 rounded-lg">
                  <QRCodeSVG 
                    value={invoice.verificationUrl || `https://luminiiadigital.com.br/verificar/${invoice.verificationCode}`}
                    size={120}
                    level="H"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Escaneie para verificar
                </p>
              </div>

              {/* Informações de Verificação */}
              <div className="flex-1">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Código de Verificação:</p>
                    <p className="text-sm font-mono font-bold text-gray-900">{invoice.verificationCode}</p>
                  </div>
                  {invoice.rps && (
                    <div>
                      <p className="text-xs text-gray-600">RPS (Recibo Provisório):</p>
                      <p className="text-sm font-semibold text-gray-900">{invoice.rps}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600">Consulte a autenticidade em:</p>
                    <p className="text-xs text-blue-600 break-all">
                      {invoice.verificationUrl || 'https://luminiiadigital.com.br/verificar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Observações */}
        {invoice.notes && (
          <div className="border-t border-gray-300 p-6 bg-yellow-50">
            <h2 className="text-sm font-bold text-gray-700 mb-2 uppercase">⚠️ Observações</h2>
            <p className="text-xs text-gray-700 leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="border-t border-gray-300 p-4 bg-gradient-to-r from-gray-100 to-gray-50">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            Documento Fiscal Eletrônico emitido nos termos da legislação vigente.<br />
            Consulte a autenticidade desta NFS-e através do código de verificação acima.
          </p>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-500 text-center">
              Documento gerado por <span className="font-semibold text-blue-600">Lumini I.A</span> - Gestão Financeira Inteligente com IA
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              https://luminiiadigital.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
