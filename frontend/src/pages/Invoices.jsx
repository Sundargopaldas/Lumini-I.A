import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CertificateModal from '../components/CertificateModal';
import IssueInvoiceModal from '../components/IssueInvoiceModal';
import CustomAlert from '../components/CustomAlert';
import api from '../services/api';

const Invoices = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremium = user.plan === 'premium';
  
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [certificate, setCertificate] = useState(null);

  // Custom Alert State
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type) => setAlertState({ isOpen: true, title, message, type });

  const [invoices, setInvoices] = useState([]);

  // Fetch invoices from backend
  const fetchInvoices = async () => {
    try {
        const response = await api.get('/invoices');
        setInvoices(response.data);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        // Fallback or empty if error
    }
  };

  // Fetch certificate status
  const fetchCertificate = async () => {
    try {
        const response = await api.get('/certificates');
        if (response.data) {
            setCertificate(response.data);
        }
    } catch (error) {
        // It's okay if not found (404)
        console.log('No certificate found or error fetching.');
    }
  };

  useEffect(() => {
    if (isPremium) {
        fetchInvoices();
        fetchCertificate();
    }
  }, [isPremium]);

  const handleSaveCertificate = (data) => {
    setCertificate(data);
    if (data) {
        showAlert('Sucesso', 'Certificado Digital conectado com sucesso! Agora você pode emitir notas.', 'success');
    } else {
        showAlert('Sucesso', 'Certificado removido com sucesso.', 'success');
    }
  };

  const handleIssueInvoice = async (data) => {
    try {
        // Clean currency string to float
        const cleanValue = typeof data.value === 'string' 
            ? parseFloat(data.value.replace(/[^\d,]/g, '').replace(',', '.')) 
            : data.value;

        const payload = {
            ...data,
            value: cleanValue
        };

        const response = await api.post('/invoices', payload);
        
        setInvoices([response.data, ...invoices]);
        showAlert('Sucesso', 'Nota fiscal emitida com sucesso!', 'success');
    } catch (error) {
        console.error('Error issuing invoice:', error);
        showAlert('Erro', 'Falha ao emitir nota fiscal.', 'error');
    }
  };

  const handleDeleteInvoice = async (id, originalId) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
        try {
            // Use originalId (database ID) if available, otherwise fallback to id (might be string)
            const idToDelete = originalId || id;
            await api.delete(`/invoices/${idToDelete}`);
            
            const updatedInvoices = invoices.filter(inv => inv.id !== id);
            setInvoices(updatedInvoices);
            showAlert('Sucesso', 'Nota fiscal excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Error deleting invoice:', error);
            showAlert('Erro', 'Falha ao excluir nota fiscal.', 'error');
        }
    }
  };

  // Calculate totals dynamically
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const franchiseLimit = 200;
  const franchiseUsedPercent = Math.min((totalCount / franchiseLimit) * 100, 100);

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    
    // --- HEADER ---
    doc.setDrawColor(0);
    doc.setFillColor(250, 250, 250);
    doc.rect(10, 10, 190, 28, 'F');
    doc.rect(10, 10, 190, 28);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PREFEITURA MUNICIPAL DE SÃO PAULO', 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text('NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e', 105, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`RPS Nº ${invoice.id} Série A, emitido em ${new Date(invoice.date).toLocaleDateString('pt-BR')}`, 105, 32, { align: 'center' });

    // --- INFO ROW ---
    let y = 40;
    doc.rect(10, y, 190, 14);
    
    // Vertical dividers
    doc.line(73, y, 73, y+14);
    doc.line(136, y, 136, y+14);

    // Col 1: Numero
    doc.setFontSize(7);
    doc.text('NÚMERO DA NOTA', 41.5, y+4, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.id, 41.5, y+10, { align: 'center' });

    // Col 2: Data Emissao
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('DATA E HORA DE EMISSÃO', 104.5, y+4, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 104.5, y+10, { align: 'center' });

    // Col 3: Codigo Verificacao
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CÓDIGO DE VERIFICAÇÃO', 168, y+4, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('A1B2-C3D4-E5F6', 168, y+10, { align: 'center' });

    // --- PRESTADOR ---
    y += 16;
    doc.rect(10, y, 190, 30);
    doc.setFillColor(230, 230, 230);
    doc.rect(10, y, 190, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTADOR DE SERVIÇOS', 105, y+4, { align: 'center' });

    // Logo placeholder (Left)
    doc.rect(14, y+9, 18, 18);
    doc.setFontSize(6);
    doc.text('LOGO', 23, y+19, { align: 'center' });

    // Details
    const startX = 38;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Razão Social:', startX, y+10);
    doc.setFont('helvetica', 'normal');
    doc.text(certificate?.razaoSocial || user.username?.toUpperCase() + ' LTDA', startX+22, y+10);

    doc.setFont('helvetica', 'bold');
    doc.text('CPF/CNPJ:', startX, y+15);
    doc.setFont('helvetica', 'normal');
    doc.text(certificate?.cnpj || '00.000.000/0001-00', startX+22, y+15);

    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', startX, y+20);
    doc.setFont('helvetica', 'normal');
    doc.text('Av. Paulista, 1000 - Bela Vista - São Paulo/SP - CEP: 01310-100', startX+22, y+20);

    doc.setFont('helvetica', 'bold');
    doc.text('Município:', startX, y+25);
    doc.setFont('helvetica', 'normal');
    doc.text('São Paulo - SP', startX+22, y+25);

    // --- TOMADOR ---
    y += 32;
    doc.rect(10, y, 190, 28);
    doc.setFillColor(230, 230, 230);
    doc.rect(10, y, 190, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOMADOR DE SERVIÇOS', 105, y+4, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nome/Razão Social:', 15, y+10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client, 50, y+10);

    doc.setFont('helvetica', 'bold');
    doc.text('CPF/CNPJ:', 15, y+15);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.clientDocument || 'Não Informado', 50, y+15);

    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', 15, y+20);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.clientAddress || 'Não Informado', 50, y+20);

    doc.setFont('helvetica', 'bold');
    doc.text('E-mail:', 15, y+25);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.clientEmail || 'Não Informado', 50, y+25);

    // --- DISCRIMINAÇÃO ---
    y += 30;
    doc.rect(10, y, 190, 50);
    doc.setFillColor(230, 230, 230);
    doc.rect(10, y, 190, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCRIMINAÇÃO DOS SERVIÇOS', 105, y+4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitService = doc.splitTextToSize(invoice.service || '', 180);
    doc.text(splitService, 15, y+12);
    
    // --- IMPOSTOS E TOTAIS ---
    y += 52;
    doc.rect(10, y, 190, 35); // Main box
    
    // Row 1: Federal Taxes Headers & Values
    doc.setFillColor(245, 245, 245);
    doc.rect(10, y, 190, 12, 'F');
    doc.line(10, y+12, 200, y+12);

    const taxes = ['PIS', 'COFINS', 'INSS', 'IR', 'CSLL', 'Outras'];
    const colWidth = 190 / 6;
    
    doc.setFontSize(7);
    taxes.forEach((tax, i) => {
        const x = 10 + (i * colWidth);
        doc.line(x + colWidth, y, x + colWidth, y+12); // Vertical line
        doc.setFont('helvetica', 'bold');
        doc.text(tax + ' (R$)', x + (colWidth/2), y+4, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('0,00', x + (colWidth/2), y+9, { align: 'center' });
    });

    // Row 2: Service Values
    doc.line(10, y+24, 200, y+24);
    
    const values = ['VALOR SERVIÇOS', 'DEDUÇÕES', 'DESC. INCOND', 'BASE CÁLCULO', 'ALÍQUOTA', 'VALOR ISS'];
    values.forEach((val, i) => {
        const x = 10 + (i * colWidth);
        doc.line(x + colWidth, y+12, x + colWidth, y+24); // Vertical line
        doc.setFont('helvetica', 'bold');
        doc.text(val, x + (colWidth/2), y+16, { align: 'center' });
    });

    // Values for Row 2
    const amountStr = invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const issStr = (invoice.amount * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    
    doc.setFont('helvetica', 'normal');
    doc.text(amountStr, 10 + (colWidth*0.5), y+21, { align: 'center' }); // Servicos
    doc.text('0,00', 10 + (colWidth*1.5), y+21, { align: 'center' }); // Deducoes
    doc.text('0,00', 10 + (colWidth*2.5), y+21, { align: 'center' }); // Desc
    doc.text(amountStr, 10 + (colWidth*3.5), y+21, { align: 'center' }); // Base
    doc.text('5%', 10 + (colWidth*4.5), y+21, { align: 'center' }); // Aliquota
    doc.text(issStr, 10 + (colWidth*5.5), y+21, { align: 'center' }); // ISS

    // Row 3: Net Value
    doc.setFillColor(220, 220, 220);
    doc.rect(10, y+24, 190, 11, 'F');
    doc.rect(10, y+24, 190, 11); // Border
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR LÍQUIDO DA NOTA', 30, y+31);
    doc.setFontSize(12);
    doc.text('R$ ' + amountStr, 180, y+31, { align: 'right' });

    // --- OUTRAS INFORMACOES ---
    y += 37;
    doc.rect(10, y, 190, 22);
    doc.setFillColor(230, 230, 230);
    doc.rect(10, y, 190, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('OUTRAS INFORMAÇÕES', 105, y+4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Esta NFS-e foi emitida com respaldo na Lei Nº 14.063/2020.', 15, y+10);
    doc.text('Documento emitido por ME ou EPP optante pelo Simples Nacional.', 15, y+14);
    doc.text('Não gera direito a crédito fiscal de IPI.', 15, y+18);
    
    // QR Code Placeholder
    doc.rect(175, y+7, 14, 14);
    doc.setFontSize(5);
    doc.text('QR CODE', 182, y+15, { align: 'center' });

    doc.save(`NFS-e-${invoice.id}.pdf`);
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-purple-600/20 p-6 rounded-full">
            <span className="text-6xl">🧾</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Automação de Notas Fiscais</h1>
        <p className="text-gray-400 max-w-lg">
          Emita notas fiscais de serviço (NFS-e) automaticamente para cada venda realizada na Hotmart, Kiwify ou Eduzz.
          Chega de trabalho manual e burocracia.
        </p>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-md w-full text-left space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
                <span>✨</span> O que você ganha no Premium:
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2">✅ Emissão automática pós-venda</li>
                <li className="flex gap-2">✅ Envio de PDF por e-mail para o cliente</li>
                <li className="flex gap-2">✅ Cálculo automático de impostos</li>
                <li className="flex gap-2">✅ Suporte a Certificado A1</li>
            </ul>
        </div>

        <Link 
          to="/plans" 
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1"
        >
          Upgrade para Premium
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      
      <CertificateModal 
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        onSave={handleSaveCertificate}
        certificate={certificate}
      />
      
      <IssueInvoiceModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onIssue={handleIssueInvoice}
      />

      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white">Notas Fiscais (NFS-e)</h1>
            <p className="text-gray-400 text-sm">Gerencie suas emissões automáticas</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsIssueModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
                <span className="text-lg">+</span> Emitir Nota
            </button>
            <button 
                onClick={() => setIsCertModalOpen(true)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    certificate ? 'bg-green-600/20 text-green-400 border border-green-600/50' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
            >
                {certificate ? '✅ Certificado Ativo' : '⚙️ Configurar Certificado'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-1">Notas Emitidas (Mês)</h3>
            <p className="text-3xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-1">Valor Total</h3>
            <p className="text-3xl font-bold text-green-400">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-1">Franquia do Plano (Mensal)</h3>
            <div className="flex items-end gap-2 mb-2">
                <p className="text-3xl font-bold text-white">{totalCount}</p>
                <p className="text-gray-400 mb-1">/ {franchiseLimit} notas</p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${franchiseUsedPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Renova em 01/01/2026</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold text-white">Histórico de Emissões</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-sm">
                    <tr>
                        <th className="p-4">Número</th>
                        <th className="p-4">Data</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Valor</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Ações</th>
                    </tr>
                </thead>
                <tbody className="text-gray-300 text-sm">
                    {invoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-purple-400">{inv.id}</td>
                            <td className="p-4">{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4">{inv.client}</td>
                            <td className="p-4">
                                {inv.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    inv.status === 'issued' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {inv.status === 'issued' ? 'EMITIDA' : 'PROCESSANDO'}
                                </span>
                            </td>
                            <td className="p-4 flex gap-2">
                                <button 
                                    onClick={() => generatePDF(inv)}
                                    className="text-white hover:text-purple-400 transition-colors" 
                                    title="Baixar PDF"
                                >
                                    📥 PDF
                                </button>
                                <button 
                                    onClick={() => handleDeleteInvoice(inv.id, inv.originalId)}
                                    className="text-white hover:text-red-400 transition-colors" 
                                    title="Excluir Nota"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
