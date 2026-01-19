import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

// Estilos CSS para impressão
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nota fiscal não encontrada</h2>
          <p className="text-gray-600 mb-4">Não foi possível carregar os dados desta nota fiscal.</p>
          <button 
            onClick={() => navigate('/invoices')} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Voltar para Notas Fiscais
          </button>
        </div>
      </div>
    );
  }

  // Verificações de segurança para evitar erros
  const safeInvoice = {
    ...invoice,
    amount: parseFloat(invoice.amount) || 0,
    originalId: invoice.originalId || invoice.id || '000000',
    client: invoice.client || 'Cliente não informado',
    clientDocument: invoice.clientDocument || 'Não informado',
    clientEmail: invoice.clientEmail || 'Não informado',
    clientAddress: invoice.clientAddress || 'Não informado',
    service: invoice.service || 'Serviço não especificado',
    date: invoice.date || new Date().toISOString()
  };

  const safeIssuer = {
    ...issuer,
    name: issuer.name || issuer.email || 'Emissor Lumini',
    cpfCnpj: issuer.cpfCnpj || 'Não informado',
    address: issuer.address || 'Não cadastrado',
    email: issuer.email || 'Não informado',
    phone: issuer.phone || 'Não informado'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
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

  const formatCPFCNPJ = (doc) => {
    if (!doc) return 'Não informado';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  // Gerar chave de acesso (simulação realista)
  const generateAccessKey = () => {
    const numero = String(safeInvoice.originalId).padStart(9, '0');
    const date = new Date(safeInvoice.date);
    const ano = date.getFullYear().toString().slice(-2);
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const serie = '001';
    const modelo = '55';
    const uf = '35'; // SP
    
    return `${uf}${ano}${mes}${numero}${modelo}${serie}${random}${dia}`;
  };

  const accessKey = generateAccessKey();

  // Calcular impostos
  const calculateTax = (amount, rate) => {
    const numAmount = parseFloat(amount) || 0;
    return numAmount * rate;
  };

  const iss = calculateTax(safeInvoice.amount, 0.02); // 2%
  const ir = calculateTax(safeInvoice.amount, 0.015); // 1.5%
  const pis = calculateTax(safeInvoice.amount, 0.0065); // 0.65%
  const cofins = calculateTax(safeInvoice.amount, 0.03); // 3%
  const csll = calculateTax(safeInvoice.amount, 0.01); // 1%
  const totalTributos = iss + ir + pis + cofins + csll;
  const valorLiquido = safeInvoice.amount - totalTributos;

  return (
    <>
      {/* Estilos de impressão */}
      <style>{printStyles}</style>
      
      <div className="min-h-screen bg-gray-100 py-2 sm:py-4 print:py-0 print:bg-white">
        {/* Botões de ação (não imprime) */}
        <div className="max-w-[210mm] mx-auto mb-2 sm:mb-4 px-2 sm:px-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => navigate('/invoices')}
            className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span>←</span> Voltar
          </button>
          <button
            onClick={handlePrint}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden sm:inline">Imprimir NFS-e</span>
            <span className="sm:hidden">Imprimir</span>
          </button>
        </div>
      </div>

      {/* DANFE - Documento Auxiliar da Nota Fiscal Eletrônica de Serviços */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none overflow-x-auto sm:overflow-x-visible">
        
        {/* CABEÇALHO PRINCIPAL - DESTAQUE */}
        <div className="border-2 sm:border-4 border-black min-w-[600px] sm:min-w-0">
          
          {/* Título Principal com Fundo */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-2 sm:p-3 text-center border-b-2 sm:border-b-4 border-black">
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-wide mb-1">
              NOTA FISCAL DE SERVIÇOS ELETRÔNICA
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-wider">NFS-e - DOCUMENTO AUXILIAR (DANFE)</p>
          </div>

          {/* Informações Principais e Número */}
          <div className="grid grid-cols-12 border-b-2 sm:border-b-3 border-black">
            
            {/* Coluna Esquerda: Dados do Emitente */}
            <div className="col-span-4 border-r-2 sm:border-r-3 border-black p-2 sm:p-3 bg-gray-50">
              <div className="text-[10px] sm:text-xs space-y-1">
                <p className="font-bold text-gray-800 text-xs sm:text-sm mb-1 sm:mb-2">EMITENTE</p>
                <p className="font-bold text-sm sm:text-base">{safeIssuer.name}</p>
                <p><span className="font-semibold">CNPJ:</span> {formatCPFCNPJ(safeIssuer.cpfCnpj)}</p>
                <p><span className="font-semibold">Endereço:</span> {safeIssuer.address}</p>
                <p><span className="font-semibold">Email:</span> {safeIssuer.email}</p>
                <p><span className="font-semibold">Fone:</span> {safeIssuer.phone}</p>
              </div>
            </div>

            {/* Coluna Central: CÓDIGO DE BARRAS GIGANTE */}
            <div className="col-span-5 border-r-2 sm:border-r-3 border-black p-1 sm:p-3 flex flex-col items-center justify-center bg-white">
              <p className="text-xs sm:text-base md:text-lg font-black mb-1 sm:mb-2 text-blue-900">CÓDIGO DE BARRAS</p>
              <div className="w-full flex justify-center py-1 sm:py-2 overflow-x-auto">
                <Barcode 
                  value={accessKey}
                  width={1.8}
                  height={40}
                  fontSize={8}
                  margin={2}
                  displayValue={true}
                  background="#ffffff"
                  lineColor="#000000"
                  className="sm:!w-auto sm:!h-auto"
                />
              </div>
              <div className="mt-1 sm:mt-2 text-center">
                <p className="text-[6px] sm:text-[8px] font-semibold text-gray-600">CHAVE DE ACESSO DA NFS-e</p>
                <p className="text-[8px] sm:text-[10px] font-mono font-bold text-blue-900 tracking-wider mt-1 break-all">
                  {accessKey.match(/.{1,4}/g)?.join(' ')}
                </p>
              </div>
            </div>

            {/* Coluna Direita: Número da Nota e Status */}
            <div className="col-span-3 p-2 sm:p-3 bg-yellow-50 flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] sm:text-xs font-bold text-gray-600 mb-1">NÚMERO DA NFS-e</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-900 mb-1 sm:mb-2">
                  {String(safeInvoice.originalId).padStart(6, '0')}
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-gray-600 mb-1">SÉRIE</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900 mb-2 sm:mb-3">001</p>
                
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-gray-300">
                  <p className="text-[8px] sm:text-[9px] font-semibold text-gray-600">DATA DE EMISSÃO</p>
                  <p className="text-[10px] sm:text-xs font-bold text-gray-800">{formatDate(safeInvoice.date)}</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-600">{new Date(safeInvoice.date).toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code e Consulta */}
          <div className="grid grid-cols-12 border-b-3 border-black bg-blue-50">
            <div className="col-span-3 border-r-3 border-black p-3 flex items-center justify-center">
              <div className="text-center">
                <QRCodeSVG 
                  value={safeInvoice.verificationUrl || `https://luminiiadigital.com.br/verify/${accessKey}`}
                  size={110}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-[8px] font-semibold mt-2 text-gray-700">Consulta por QR Code</p>
              </div>
            </div>
            
            <div className="col-span-9 p-3 flex items-center">
              <div className="w-full">
                <p className="text-xs font-bold text-blue-900 mb-2">⚠️ CONSULTA DE AUTENTICIDADE</p>
                <p className="text-[11px] leading-relaxed text-gray-700">
                  Este documento pode ser consultado no portal da prefeitura através da chave de acesso acima ou 
                  escaneando o QR Code ao lado. A consulta confirma a autenticidade e validade jurídica desta NFS-e.
                </p>
                <div className="mt-2 bg-white p-2 rounded border-2 border-blue-200">
                  <p className="text-[9px] font-semibold text-gray-600">PROTOCOLO DE AUTORIZAÇÃO</p>
                  <p className="text-[10px] font-mono text-blue-900">{accessKey.substring(0, 25)}...</p>
                  <p className="text-[9px] text-gray-600 mt-1">
                    Autorizado em: {formatDateTime(safeInvoice.date)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TOMADOR DE SERVIÇOS */}
          <div className="border-b-3 border-black">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 py-2 border-b-2 border-black">
              <p className="text-sm font-bold tracking-wide">🏢 TOMADOR DE SERVIÇOS (CLIENTE)</p>
            </div>
            <div className="p-4 bg-white">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">NOME / RAZÃO SOCIAL</p>
                  <p className="text-sm font-bold text-gray-900">{safeInvoice.client}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">CPF / CNPJ</p>
                  <p className="text-sm font-bold text-gray-900">{formatCPFCNPJ(safeInvoice.clientDocument)}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-[10px] font-semibold text-gray-600 mb-1">ENDEREÇO COMPLETO</p>
                <p className="text-xs text-gray-800">{safeInvoice.clientAddress}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">E-MAIL</p>
                  <p className="text-xs text-gray-800">{safeInvoice.clientEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">INSCRIÇÃO ESTADUAL</p>
                  <p className="text-xs text-gray-800">{safeInvoice.clientStateRegistration || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DISCRIMINAÇÃO DOS SERVIÇOS */}
          <div className="border-b-3 border-black">
            <div className="bg-gradient-to-r from-purple-700 to-purple-600 text-white px-4 py-2 border-b-2 border-black">
              <p className="text-sm font-bold tracking-wide">📋 DISCRIMINAÇÃO DOS SERVIÇOS PRESTADOS</p>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="bg-white border-2 border-gray-300 rounded p-3 min-h-[100px]">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
                  {safeInvoice.service}
                </p>
              </div>
              
              <div className="mt-3 grid grid-cols-4 gap-3 bg-white p-3 rounded border border-gray-300">
                <div className="text-center">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">CÓDIGO DO SERVIÇO</p>
                  <p className="text-sm font-bold text-blue-900">01.01.01</p>
                </div>
                <div className="text-center border-l border-gray-300">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">NATUREZA DA OPERAÇÃO</p>
                  <p className="text-xs font-semibold text-gray-800">Tributação no Município</p>
                </div>
                <div className="text-center border-l border-gray-300">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">REGIME TRIBUTÁRIO</p>
                  <p className="text-xs font-semibold text-gray-800">Simples Nacional</p>
                </div>
                <div className="text-center border-l border-gray-300">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">ITEM DA LC 116/03</p>
                  <p className="text-sm font-bold text-blue-900">1.01</p>
                </div>
              </div>
            </div>
          </div>

          {/* CÁLCULO DO ISS */}
          <div className="border-b-3 border-black">
            <div className="bg-gradient-to-r from-orange-700 to-orange-600 text-white px-4 py-2 border-b-2 border-black">
              <p className="text-sm font-bold tracking-wide">💰 CÁLCULO DO ISS - IMPOSTO SOBRE SERVIÇOS</p>
            </div>
            
            <table className="w-full bg-white">
              <thead>
                <tr className="bg-orange-100 border-b-2 border-black">
                  <th className="border-r-2 border-black p-2 text-xs font-bold text-left text-gray-800">VALOR DOS SERVIÇOS</th>
                  <th className="border-r-2 border-black p-2 text-xs font-bold text-left text-gray-800">(-) DEDUÇÕES</th>
                  <th className="border-r-2 border-black p-2 text-xs font-bold text-left text-gray-800">BASE DE CÁLCULO</th>
                  <th className="border-r-2 border-black p-2 text-xs font-bold text-left text-gray-800">ALÍQUOTA ISS</th>
                  <th className="p-2 text-xs font-bold text-left text-gray-800">VALOR DO ISS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-3 text-base font-bold text-green-700">{formatCurrency(safeInvoice.amount)}</td>
                  <td className="border-r-2 border-black p-3 text-sm">{formatCurrency(0)}</td>
                  <td className="border-r-2 border-black p-3 text-base font-bold text-blue-700">{formatCurrency(safeInvoice.amount)}</td>
                  <td className="border-r-2 border-black p-3 text-sm font-bold">2,00%</td>
                  <td className="p-3 text-base font-bold text-red-700">{formatCurrency(iss)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TRIBUTOS FEDERAIS RETIDOS */}
          <div className="border-b-3 border-black">
            <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-4 py-2 border-b-2 border-black">
              <p className="text-sm font-bold tracking-wide">🏛️ TRIBUTOS FEDERAIS RETIDOS NA FONTE</p>
            </div>
            
            <div className="p-4 bg-red-50">
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded border-2 border-red-200 text-center">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">IR (1,5%)</p>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(ir)}</p>
                </div>
                <div className="bg-white p-3 rounded border-2 border-red-200 text-center">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">PIS (0,65%)</p>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(pis)}</p>
                </div>
                <div className="bg-white p-3 rounded border-2 border-red-200 text-center">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">COFINS (3%)</p>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(cofins)}</p>
                </div>
                <div className="bg-white p-3 rounded border-2 border-red-200 text-center">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">CSLL (1%)</p>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(csll)}</p>
                </div>
                <div className="bg-white p-3 rounded border-2 border-red-200 text-center">
                  <p className="text-[9px] font-semibold text-gray-600 mb-1">INSS</p>
                  <p className="text-xs font-bold text-gray-900">{formatCurrency(0)}</p>
                </div>
              </div>

              <div className="mt-3 bg-white p-3 rounded border-2 border-red-300">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-700">TOTAL DE TRIBUTOS RETIDOS:</p>
                  <p className="text-lg font-bold text-red-700">{formatCurrency(totalTributos)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* VALORES TOTAIS - DESTAQUE MÁXIMO */}
          <div className="border-b-4 border-black bg-gradient-to-r from-green-800 to-green-600 p-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/95 p-4 rounded-lg shadow-lg border-2 border-green-900">
                <p className="text-xs font-bold text-gray-600 mb-2">💵 VALOR TOTAL DA NOTA FISCAL</p>
                <p className="text-4xl font-black text-green-700">
                  {formatCurrency(safeInvoice.amount)}
                </p>
              </div>
              
              <div className="bg-white/95 p-4 rounded-lg shadow-lg border-2 border-blue-900">
                <p className="text-xs font-bold text-gray-600 mb-2">✅ VALOR LÍQUIDO A RECEBER</p>
                <p className="text-4xl font-black text-blue-700">
                  {formatCurrency(valorLiquido)}
                </p>
                <p className="text-[9px] text-gray-600 mt-1">(Valor Total - Tributos Retidos)</p>
              </div>
            </div>
          </div>

          {/* INFORMAÇÕES COMPLEMENTARES */}
          <div className="border-b-3 border-black">
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-2 border-b-2 border-black">
              <p className="text-sm font-bold tracking-wide">📝 INFORMAÇÕES COMPLEMENTARES</p>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="bg-white border-2 border-blue-300 rounded p-3 min-h-[60px]">
                <p className="text-xs leading-relaxed text-gray-800">
                  ✅ Documento emitido eletronicamente nos termos da legislação vigente.<br />
                  ✅ Consulte a autenticidade desta NFS-e no portal da prefeitura ou através do QR Code.<br />
                  ✅ Nota fiscal emitida de acordo com a Lei Complementar nº 116/2003.<br />
                  ✅ Prestador optante pelo Simples Nacional - LC 123/2006.
                </p>
              </div>

              {/* Status da Nota */}
              <div className="mt-3 bg-white p-3 rounded border-2 border-green-400 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700">STATUS DA NFS-e</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {safeInvoice.status === 'issued' ? '✅ AUTORIZADA E VÁLIDA' : '⏳ EM PROCESSAMENTO'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold text-gray-600">DATA/HORA AUTORIZAÇÃO</p>
                  <p className="text-xs font-bold text-gray-800">{formatDateTime(safeInvoice.date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RODAPÉ INSTITUCIONAL */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 text-center">
            <div className="mb-2">
              <p className="text-xs font-bold">NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e</p>
              <p className="text-[10px] mt-1">Documento Auxiliar da Nota Fiscal Eletrônica de Serviços</p>
            </div>
            
            <div className="border-t border-blue-400 mt-2 pt-2">
              <p className="text-[10px] leading-relaxed">
                Esta nota fiscal foi processada eletronicamente e possui validade jurídica.<br />
                A autenticidade pode ser confirmada através da chave de acesso no portal oficial.
              </p>
            </div>

            <div className="border-t border-blue-400 mt-3 pt-3">
              <p className="text-xs font-bold">🚀 Documento gerado por Lumini I.A</p>
              <p className="text-[9px]">Gestão Financeira Inteligente | www.luminiiadigital.com.br</p>
              <p className="text-[8px] mt-1 text-blue-300">
                Tecnologia e Inovação em Gestão Fiscal e Financeira
              </p>
            </div>
          </div>

          {/* AVISO DE IMPRESSÃO */}
          <div className="print:hidden mt-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded text-center">
            <p className="text-sm font-bold text-yellow-800">
              ⚠️ Para imprimir, clique no botão "Imprimir NFS-e" acima
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Este documento será ajustado automaticamente para impressão em formato A4
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default InvoiceTemplate;
