import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CertificateModal from '../components/CertificateModal';
import IssueInvoiceModal from '../components/IssueInvoiceModal';
import CustomAlert from '../components/CustomAlert';

const Invoices = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremium = user.plan === 'premium';
  
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [certificate, setCertificate] = useState(null);

  // Custom Alert State
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type) => setAlertState({ isOpen: true, title, message, type });

  // Mock Data
  const [invoices, setInvoices] = useState([
    { id: '20250001', date: '2025-12-20', client: 'João Silva', amount: 97.00, status: 'issued', service: 'Curso Online de Marketing Digital' },
    { id: '20250002', date: '2025-12-21', client: 'Maria Oliveira', amount: 197.00, status: 'issued', service: 'Consultoria Financeira' },
    { id: '20250003', date: '2025-12-22', client: 'Pedro Santos', amount: 97.00, status: 'processing', service: 'Ebook: Investimentos' },
  ]);

  const handleSaveCertificate = (data) => {
    setCertificate(data);
    showAlert('Sucesso', 'Certificado Digital conectado com sucesso! Agora você pode emitir notas.', 'success');
  };

  const handleIssueInvoice = (data) => {
    const newInvoice = {
        id: (parseInt(invoices[0]?.id || '20250000') + 1).toString(),
        date: new Date().toISOString().split('T')[0],
        client: data.clientName,
        amount: parseFloat(data.value),
        status: 'processing',
        service: data.serviceDescription
    };
    setInvoices([newInvoice, ...invoices]);
    showAlert('Processando', 'A nota fiscal foi enviada para processamento na prefeitura. Você será notificado por e-mail.', 'success');
  };

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    
    // Header - Prefeitura
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 10, 190, 25, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PREFEITURA MUNICIPAL DE SÃO PAULO', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('SECRETARIA DE FINANÇAS - NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e', 105, 30, { align: 'center' });

    // Invoice Info
    doc.rect(10, 37, 190, 20);
    doc.setFontSize(10);
    doc.text(`Número da Nota: ${invoice.id}`, 15, 45);
    doc.text(`Data e Hora de Emissão: ${invoice.date} 14:30:00`, 15, 52);
    doc.text(`Código de Verificação: A1B2-C3D4`, 120, 45);

    // Prestador (User)
    doc.rect(10, 59, 190, 35);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTADOR DE SERVIÇOS', 15, 66);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Razão Social: ${certificate?.razaoSocial || user.username + ' LTDA'}`, 15, 73);
    doc.text(`CNPJ: ${certificate?.cnpj || '00.000.000/0001-00'}`, 15, 79);
    doc.text(`E-mail: ${user.email}`, 15, 85);

    // Tomador (Client)
    doc.rect(10, 96, 190, 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOMADOR DE SERVIÇOS', 15, 103);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome/Razão Social: ${invoice.client}`, 15, 110);
    doc.text('CPF/CNPJ: 123.456.789-00', 15, 116);
    doc.text('Endereço: Não Informado', 15, 122);

    // Discriminação dos Serviços
    doc.rect(10, 133, 190, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DISCRIMINAÇÃO DOS SERVIÇOS', 15, 140);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoice.service, 15, 148);
    doc.text('Serviço prestado referente à venda de infoproduto.', 15, 154);

    // Valores
    doc.rect(10, 185, 190, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL DA NOTA = R$ ' + invoice.amount.toFixed(2), 105, 205, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.text('Documento emitido por ME ou EPP optante pelo Simples Nacional.', 105, 280, { align: 'center' });

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
            <p className="text-3xl font-bold text-white">127</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-1">Valor Total</h3>
            <p className="text-3xl font-bold text-green-400">R$ 12.450,00</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h3 className="text-gray-400 text-sm mb-1">Franquia do Plano (Mensal)</h3>
            <div className="flex items-end gap-2 mb-2">
                <p className="text-3xl font-bold text-white">127</p>
                <p className="text-gray-400 mb-1">/ 200 notas</p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '63%' }}></div>
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
                            <td className="p-4 font-mono text-purple-300">{inv.id}</td>
                            <td className="p-4">{new Date(inv.date).toLocaleDateString()}</td>
                            <td className="p-4">{inv.client}</td>
                            <td className="p-4">R$ {inv.amount.toFixed(2)}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    inv.status === 'issued' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {inv.status === 'issued' ? 'EMITIDA' : 'PROCESSANDO'}
                                </span>
                            </td>
                            <td className="p-4">
                                <button 
                                    onClick={() => generatePDF(inv)}
                                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs border border-white/10 px-2 py-1 rounded hover:bg-white/10"
                                >
                                    📥 PDF
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
