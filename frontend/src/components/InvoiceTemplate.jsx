import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando nota fiscal...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !issuer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Gerar chave de acesso (simulação)
  const generateAccessKey = () => {
    const numero = String(invoice.number || invoice.originalId).padStart(9, '0');
    const ano = new Date(invoice.issueDate || invoice.date).getFullYear();
    const mes = String(new Date(invoice.issueDate || invoice.date).getMonth() + 1).padStart(2, '0');
    return `${numero}${ano}${mes}${Math.floor(Math.random() * 10000000000000000000).toString().padStart(20, '0')}`;
  };

  const accessKey = invoice.verificationCode || generateAccessKey();

  return (
    <div className="min-h-screen bg-gray-100 py-4 print:py-0 print:bg-white">
      {/* Botões de ação (não imprime) */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ← Voltar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir NFS-e
          </button>
        </div>
      </div>

      {/* DANFE - Documento Auxiliar da Nota Fiscal Eletrônica de Serviços */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none p-2">
        
        {/* CABEÇALHO - Identificação e Código de Barras */}
        <div className="border-2 border-black">
          <div className="grid grid-cols-3 border-b-2 border-black">
            {/* Coluna 1: Recibo/Título */}
            <div className="border-r-2 border-black p-2">
              <div className="text-[8px] leading-tight mb-1">
                <p className="font-bold">PREFEITURA MUNICIPAL</p>
                <p>SECRETARIA DE FINANÇAS</p>
                <p className="mt-1 text-[7px]">
                  Nota Fiscal de Serviços Eletrônica - NFS-e
                </p>
                <p className="text-[7px]">
                  Emitida em ambiente de {process.env.NUVEM_FISCAL_ENV === 'production' ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
                </p>
              </div>
            </div>

            {/* Coluna 2: DANFE e Código de Barras */}
            <div className="border-r-2 border-black p-2 flex flex-col items-center justify-center">
              <p className="text-xs font-bold mb-1">DANF-e</p>
              <p className="text-[9px] mb-1">Documento Auxiliar da Nota</p>
              <p className="text-[9px] mb-2">Fiscal Eletrônica de Serviços</p>
              
              {/* Código de Barras */}
              <div className="w-full flex justify-center">
                <Barcode 
                  value={accessKey}
                  width={1}
                  height={35}
                  fontSize={8}
                  margin={0}
                  displayValue={false}
                />
              </div>
            </div>

            {/* Coluna 3: Número e Série */}
            <div className="p-2 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold">NFS-e</p>
              <p className="text-lg font-bold">Nº {String(invoice.number || invoice.originalId).padStart(9, '0')}</p>
              <p className="text-[10px] font-bold mt-1">Série 001</p>
              <p className="text-[8px] mt-2 text-center">{formatDateTime(invoice.issueDate || invoice.date)}</p>
            </div>
          </div>

          {/* Chave de Acesso */}
          <div className="border-b-2 border-black p-1 bg-gray-50">
            <p className="text-[7px] font-bold text-center">CHAVE DE ACESSO</p>
            <p className="text-[9px] font-mono text-center tracking-wider">{accessKey.match(/.{1,4}/g)?.join(' ')}</p>
          </div>

          {/* Consulta de autenticidade */}
          <div className="border-b-2 border-black p-1 text-center">
            <p className="text-[7px]">
              Consulte a autenticidade desta NFS-e no portal da prefeitura ou escaneie o QR Code
            </p>
          </div>

          {/* IDENTIFICAÇÃO DO PRESTADOR */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 border-b border-black px-2 py-0.5">
              <p className="text-[8px] font-bold">PRESTADOR DE SERVIÇOS</p>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <p className="text-[7px] text-gray-600">Nome / Razão Social</p>
                  <p className="text-[9px] font-bold">{invoice.providerName || issuer.name || issuer.email}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-[7px] text-gray-600">CPF/CNPJ</p>
                      <p className="text-[8px]">{invoice.providerDocument || issuer.cpfCnpj || 'Não informado'}</p>
                    </div>
                    {invoice.providerMunicipalRegistration && (
                      <div>
                        <p className="text-[7px] text-gray-600">Inscrição Municipal</p>
                        <p className="text-[8px]">{invoice.providerMunicipalRegistration}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-1">
                    <p className="text-[7px] text-gray-600">Endereço</p>
                    <p className="text-[8px]">{invoice.providerAddress || 'Não cadastrado'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-[7px] text-gray-600">Email</p>
                      <p className="text-[8px]">{invoice.providerEmail || issuer.email}</p>
                    </div>
                    {invoice.providerPhone && (
                      <div>
                        <p className="text-[7px] text-gray-600">Telefone</p>
                        <p className="text-[8px]">{invoice.providerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center border-l border-gray-300 pl-2">
                  <QRCodeSVG 
                    value={invoice.verificationUrl || `https://luminiiadigital.com.br/nfse/${accessKey}`}
                    size={80}
                    level="H"
                  />
                  <p className="text-[6px] text-center mt-1">Consulta de Autenticidade</p>
                </div>
              </div>
            </div>
          </div>

          {/* IDENTIFICAÇÃO DO TOMADOR */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 border-b border-black px-2 py-0.5">
              <p className="text-[8px] font-bold">TOMADOR DE SERVIÇOS</p>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[7px] text-gray-600">Nome / Razão Social</p>
                  <p className="text-[9px] font-bold">{invoice.borrowerName || invoice.client}</p>
                </div>
                <div>
                  <p className="text-[7px] text-gray-600">CPF/CNPJ</p>
                  <p className="text-[8px]">{invoice.borrowerDocument || invoice.clientDocument || 'Não informado'}</p>
                </div>
              </div>

              <div className="mt-1">
                <p className="text-[7px] text-gray-600">Endereço</p>
                <p className="text-[8px]">{invoice.borrowerAddress || invoice.clientAddress || 'Não informado'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <p className="text-[7px] text-gray-600">Email</p>
                  <p className="text-[8px]">{invoice.borrowerEmail || invoice.clientEmail || 'Não informado'}</p>
                </div>
                {(invoice.borrowerPhone || invoice.clientPhone) && (
                  <div>
                    <p className="text-[7px] text-gray-600">Telefone</p>
                    <p className="text-[8px]">{invoice.borrowerPhone || invoice.clientPhone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DISCRIMINAÇÃO DOS SERVIÇOS */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 border-b border-black px-2 py-0.5">
              <p className="text-[8px] font-bold">DISCRIMINAÇÃO DOS SERVIÇOS</p>
            </div>
            <div className="p-2">
              <div className="min-h-[80px] text-[9px] leading-relaxed whitespace-pre-wrap">
                {invoice.serviceDescription || invoice.service || 'Descrição não informada'}
              </div>
              
              {invoice.serviceCode && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[7px] text-gray-600">Código do Serviço</p>
                      <p className="text-[8px] font-semibold">{invoice.serviceCode}</p>
                    </div>
                    {invoice.operationNature && (
                      <div>
                        <p className="text-[7px] text-gray-600">Natureza da Operação</p>
                        <p className="text-[8px]">{invoice.operationNature}</p>
                      </div>
                    )}
                    {invoice.taxRegime && (
                      <div>
                        <p className="text-[7px] text-gray-600">Regime Tributário</p>
                        <p className="text-[8px]">{invoice.taxRegime}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VALORES E IMPOSTOS */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 border-b border-black px-2 py-0.5">
              <p className="text-[8px] font-bold">VALORES E TRIBUTOS</p>
            </div>
            
            {/* Tabela de Valores */}
            <table className="w-full text-[8px]">
              <thead>
                <tr className="bg-gray-50 border-b border-black">
                  <th className="border-r border-black p-1 text-left">Valor dos Serviços</th>
                  <th className="border-r border-black p-1 text-left">(-) Deduções</th>
                  <th className="border-r border-black p-1 text-left">Base de Cálculo</th>
                  <th className="border-r border-black p-1 text-left">Alíquota</th>
                  <th className="p-1 text-left">Valor do ISS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 font-semibold">{formatCurrency(invoice.amount)}</td>
                  <td className="border-r border-black p-1">{formatCurrency(invoice.deductions || 0)}</td>
                  <td className="border-r border-black p-1">{formatCurrency(invoice.amount - (invoice.deductions || 0))}</td>
                  <td className="border-r border-black p-1">{invoice.issRate || '2,00'}%</td>
                  <td className="p-1 font-semibold text-red-600">{formatCurrency(invoice.issAmount || 0)}</td>
                </tr>
              </tbody>
            </table>

            {/* Outros Impostos Retidos */}
            {(invoice.irAmount > 0 || invoice.pisAmount > 0 || invoice.cofinsAmount > 0 || invoice.csllAmount > 0 || invoice.inssAmount > 0) && (
              <div className="border-t border-black p-2">
                <p className="text-[7px] font-bold mb-1">IMPOSTOS FEDERAIS RETIDOS NA FONTE</p>
                <div className="grid grid-cols-5 gap-2 text-[8px]">
                  {invoice.irAmount > 0 && (
                    <div>
                      <p className="text-[7px] text-gray-600">IR</p>
                      <p className="font-semibold">{formatCurrency(invoice.irAmount)}</p>
                    </div>
                  )}
                  {invoice.pisAmount > 0 && (
                    <div>
                      <p className="text-[7px] text-gray-600">PIS</p>
                      <p className="font-semibold">{formatCurrency(invoice.pisAmount)}</p>
                    </div>
                  )}
                  {invoice.cofinsAmount > 0 && (
                    <div>
                      <p className="text-[7px] text-gray-600">COFINS</p>
                      <p className="font-semibold">{formatCurrency(invoice.cofinsAmount)}</p>
                    </div>
                  )}
                  {invoice.csllAmount > 0 && (
                    <div>
                      <p className="text-[7px] text-gray-600">CSLL</p>
                      <p className="font-semibold">{formatCurrency(invoice.csllAmount)}</p>
                    </div>
                  )}
                  {invoice.inssAmount > 0 && (
                    <div>
                      <p className="text-[7px] text-gray-600">INSS</p>
                      <p className="font-semibold">{formatCurrency(invoice.inssAmount)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Valor Total */}
            <div className="bg-gray-100 border-t-2 border-black p-2">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-bold">VALOR TOTAL DA NOTA</p>
                <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[8px]">Valor Líquido (Valor Total - Impostos Retidos)</p>
                <p className="text-base font-bold text-green-600">
                  {formatCurrency(invoice.amount - (invoice.taxAmount || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* DADOS ADICIONAIS */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 border-b border-black px-2 py-0.5">
              <p className="text-[8px] font-bold">INFORMAÇÕES COMPLEMENTARES</p>
            </div>
            <div className="p-2 min-h-[40px]">
              <p className="text-[8px] leading-relaxed">
                {invoice.notes || 'Documento emitido por meio eletrônico. Consulte a autenticidade no portal da prefeitura.'}
              </p>
              {invoice.rps && (
                <p className="text-[7px] text-gray-600 mt-1">
                  RPS Nº {invoice.rps} convertido nesta NFS-e
                </p>
              )}
            </div>
          </div>

          {/* PROTOCOLO DE AUTORIZAÇÃO */}
          {invoice.verificationCode && (
            <div className="bg-green-50 p-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[7px] font-bold text-green-700">PROTOCOLO DE AUTORIZAÇÃO DE USO</p>
                  <p className="text-[8px] font-mono">{invoice.verificationCode}</p>
                  <p className="text-[7px] text-gray-600">
                    Data de Autorização: {formatDateTime(invoice.issueDate || invoice.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-green-600">
                    {invoice.status === 'issued' ? '✓ NFS-e AUTORIZADA' : '⏳ PROCESSANDO'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RODAPÉ */}
          <div className="bg-gray-100 p-2 text-center border-t border-black">
            <p className="text-[7px] leading-tight">
              Nota Fiscal de Serviços Eletrônica - NFS-e<br />
              Emitida nos termos da legislação vigente. Consulte a autenticidade através da chave de acesso.<br />
              <span className="font-semibold">Documento gerado por Lumini I.A - Gestão Financeira Inteligente</span><br />
              www.luminiiadigital.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
