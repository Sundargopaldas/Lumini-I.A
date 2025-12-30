import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import CertificateModal from '../components/CertificateModal';
import IssueInvoiceModal from '../components/IssueInvoiceModal';
import CustomAlert from '../components/CustomAlert';
import api from '../services/api';

const Invoices = () => {
  const { t, i18n } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremium = user.plan === 'premium';
  
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [certificate, setCertificate] = useState(null);

  // Custom Alert State
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type, onConfirm) => setAlertState({ isOpen: true, title, message, type, onConfirm });

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
        showAlert(t('common.success'), t('invoices.cert_connected_success'), 'success');
    } else {
        showAlert(t('common.success'), t('invoices.cert_removed_success'), 'success');
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
        showAlert(t('common.success'), t('invoices.invoice_issued_success'), 'success');
    } catch (error) {
        console.error('Error issuing invoice:', error);
        showAlert(t('common.error'), t('invoices.invoice_issue_error'), 'error');
    }
  };

  const handleDeleteInvoice = (id, originalId) => {
    showAlert(
        t('invoices.delete_invoice_title'),
        t('invoices.delete_invoice_confirm'),
        'confirm',
        async () => {
            try {
                // Use originalId (database ID) if available, otherwise fallback to id (might be string)
                const idToDelete = originalId || id;
                await api.delete(`/invoices/${idToDelete}`);
                
                const updatedInvoices = invoices.filter(inv => inv.id !== id);
                setInvoices(updatedInvoices);
                showAlert(t('common.success'), t('invoices.invoice_deleted_success'), 'success');
            } catch (error) {
                console.error('Error deleting invoice:', error);
                showAlert(t('common.error'), t('invoices.delete_invoice_error'), 'error');
            }
        }
    );
  };

  // Calculate totals dynamically
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const franchiseLimit = 200;
  const franchiseUsedPercent = Math.min((totalCount / franchiseLimit) * 100, 100);

  const getDataUri = (url) => {
    return new Promise((resolve) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = () => resolve(null);
        image.src = url;
    });
  };

  const generatePDF = async (invoice) => {
    const doc = new jsPDF();
    
    // Helper to draw barcode (Mock implementation of Interleaved 2 of 5 visual)
    const drawBarcode = (x, y, width, height, code) => {
        doc.setFillColor(0, 0, 0);
        
        // Calculate total units to ensure it fills the width exactly
        // Even digit: 2 units bar + 1 unit gap = 3 units
        // Odd digit: 1 unit bar + 1 unit gap = 2 units
        const totalUnits = code.split('').reduce((acc, d) => acc + (parseInt(d, 10) % 2 === 0 ? 3 : 2), 0);
        const thin = width / totalUnits; 

        let currentX = x;
        
        for (let i = 0; i < code.length; i++) {
            const val = parseInt(code[i], 10);
            const isEven = val % 2 === 0;
            const barW = (isEven ? 2 : 1) * thin; 
            
            doc.rect(currentX, y, barW, height, 'F');
            currentX += barW + thin; // Gap
        }
        
        // Code text
        doc.setFontSize(9);
        doc.setFont('courier', 'bold');
        doc.text(code.match(/.{1,4}/g).join(' '), x + (width/2), y + height + 4, { align: 'center' });
    };

    // --- HEADER ---
    doc.setDrawColor(0, 0, 0); 
    // Impactful Color: Dark Charcoal / Black (User requested "Impactful", "Blue is ugly")
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(10, 10, 190, 28, 'F');
    doc.rect(10, 10, 190, 28);
    
    doc.setTextColor(255, 255, 255); // White Text
    doc.setFontSize(16); // Larger
    doc.setFont('helvetica', 'bold');
    doc.text(t('invoices.pdf.nfse_title').toUpperCase(), 105, 22, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const rpsText = t('invoices.pdf.rps_text', { 
        number: invoice.id.toString().padStart(6, '0'), 
        date: new Date(invoice.date || new Date()).toLocaleDateString(i18n.language) 
    });
    doc.text(rpsText, 105, 32, { align: 'center' });
    
    doc.setTextColor(30, 41, 59); // Dark Text

    // --- INFO ROW ---
    let y = 42;
    doc.rect(10, y, 190, 16);
    
    // Vertical dividers
    doc.line(73, y, 73, y+16);
    doc.line(136, y, 136, y+16);

    // Col 1: Numero
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(t('invoices.pdf.note_number'), 41.5, y+5, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.id.toString().padStart(8, '0'), 41.5, y+12, { align: 'center' });

    // Col 2: Data Emissao
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(t('invoices.pdf.issue_date'), 104.5, y+5, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    const issueDate = invoice.date ? new Date(invoice.date) : new Date();
    doc.text(`${issueDate.toLocaleDateString(i18n.language)} ${issueDate.toLocaleTimeString(i18n.language)}`, 104.5, y+12, { align: 'center' });

    // Col 3: Codigo Verificacao
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(t('invoices.pdf.verification_code'), 168, y+5, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    const mockHash = `A${invoice.id}B-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
    doc.text(mockHash, 168, y+12, { align: 'center' });

    // --- PRESTADOR ---
    y += 20;
    doc.rect(10, y, 190, 38);
    // Header Bar
    doc.setFillColor(241, 245, 249); // Slate 100 (Light Gray)
    doc.rect(10, y, 190, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(t('invoices.pdf.provider_title').toUpperCase(), 105, y+5, { align: 'center' });
    
    // ... Logo Logic ...


    // Logo Logic
    let logoAdded = false;
    if (user.logo) {
        const API_URL = import.meta.env.VITE_API_URL;
        const BASE_URL = API_URL ? API_URL.replace('/api', '') : '';
        const logoUrl = `${BASE_URL}/uploads/logos/${user.logo}?t=${new Date().getTime()}`;
        
        try {
            const logoData = await getDataUri(logoUrl);
            if (logoData) {
                doc.addImage(logoData, 'PNG', 14, y+9, 20, 20);
                logoAdded = true;
            }
        } catch (e) {
            console.error("Logo error", e);
        }
    }

    // Provider Info
    const leftMargin = logoAdded ? 40 : 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(user.name || t('invoices.pdf.provider_name_fallback'), leftMargin, y+11);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const cpfCnpj = user.cpfCnpj || '00.000.000/0001-00';
    doc.text(`CPF/CNPJ: ${cpfCnpj}`, leftMargin, y+16);
    doc.text(`Email: ${user.email}`, leftMargin, y+21);
    doc.text(`Endereço: ${user.address || t('invoices.pdf.not_informed')}`, leftMargin, y+26);


    // --- TOMADOR ---
    y += 37;
    doc.rect(10, y, 190, 30);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(10, y, 190, 6, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(t('invoices.pdf.client_title').toUpperCase(), 105, y+5, { align: 'center' });
    doc.setTextColor(60, 60, 60);

    doc.setFontSize(9);
    doc.text(invoice.client || t('invoices.pdf.client_not_identified'), 15, y+11);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`CPF/CNPJ: ${invoice.clientDocument || t('invoices.pdf.not_informed')}`, 15, y+16);
    doc.text(`Email: ${invoice.clientEmail || t('invoices.pdf.not_informed')}`, 15, y+21);
    doc.text(`Endereço: ${invoice.clientAddress || t('invoices.pdf.not_informed')}`, 15, y+26);

    // --- DISCRIMINAÇÃO ---
    y += 32;
    // Calculate height based on text length
    doc.rect(10, y, 190, 50);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(10, y, 190, 6, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(t('invoices.pdf.service_desc_title').toUpperCase(), 105, y+5, { align: 'center' });
    doc.setTextColor(60, 60, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    // Split text to fit width
    const splitText = doc.splitTextToSize(invoice.service || '', 180);
    doc.text(splitText, 15, y+12);

    // --- VALORES E IMPOSTOS (SIMULADO) ---
    y += 52;
    doc.rect(10, y, 190, 20);
    
    // Header Row
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(10, y, 190, 6, 'F');
    
    const colWidth = 190/6;
    const headers = ['PIS (0,65%)', 'COFINS (3%)', 'INSS', 'IR (1,5%)', 'CSLL (1%)', 'ISS (5%)'];
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    headers.forEach((h, i) => {
        doc.text(h, 10 + (i * colWidth) + (colWidth/2), y+4, { align: 'center' });
        // Vertical lines
        if(i > 0) doc.line(10 + (i * colWidth), y, 10 + (i * colWidth), y+14);
    });
    doc.setTextColor(60, 60, 60);

    // Values Row
    doc.setFont('helvetica', 'normal');
    const valor = invoice.amount || 0;
    const vals = [
        (valor * 0.0065).toLocaleString(i18n.language, {style: 'currency', currency: 'BRL'}),
        (valor * 0.03).toLocaleString(i18n.language, {style: 'currency', currency: 'BRL'}),
        'R$ 0,00',
        (valor * 0.015).toLocaleString(i18n.language, {style: 'currency', currency: 'BRL'}),
        (valor * 0.01).toLocaleString(i18n.language, {style: 'currency', currency: 'BRL'}),
        (valor * 0.05).toLocaleString(i18n.language, {style: 'currency', currency: 'BRL'}),
    ];
    
    vals.forEach((v, i) => {
        doc.text(v, 10 + (i * colWidth) + (colWidth/2), y+12, { align: 'center' });
        // Vertical lines should stop at the separator line (y+14) to not cross the Total text
        if(i > 0) doc.line(10 + (i * colWidth), y+6, 10 + (i * colWidth), y+14);
    });
    
    doc.line(10, y+14, 200, y+14); // Separator

    // Total Line
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL DA NOTA:', 110, y+18);
    doc.text(valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}), 195, y+18, { align: 'right' });

    // --- RODAPÉ ---
    y += 25;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento emitido por ME ou EPP optante pelo Simples Nacional.', 105, y, { align: 'center' });
    doc.text('Não gera direito a crédito fiscal de IPI.', 105, y+4, { align: 'center' });
    
    // --- BARCODE ---
    y += 8;
    // Use invoice Access Key if available, or generate a valid-looking 44 digit mock
    const randomDigits = (len) => Array.from({length: len}, () => Math.floor(Math.random()*10)).join('');
    const accessKey = invoice.nfeAccessKey || `35${new Date().getFullYear()}${randomDigits(38)}`;
    drawBarcode(50, y, 110, 15, accessKey); // Centered barcode

    // Save
    doc.save(`NFS-e-${invoice.id}.pdf`);

  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-purple-600/10 dark:bg-purple-600/20 p-6 rounded-full">
            <span className="text-6xl">🧾</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Automação de Notas Fiscais</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg">
          Emita notas fiscais de serviço (NFS-e) automaticamente para cada venda realizada na Hotmart, Kiwify ou Eduzz.
          Chega de trabalho manual e burocracia.
        </p>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 max-w-md w-full text-left space-y-3 shadow-lg dark:shadow-none">
            <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                <span>✨</span> O que você ganha no Premium:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
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
        onConfirm={alertState.onConfirm}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsIssueModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
                <span className="text-lg">+</span> {t('invoices.issue_invoice')}
            </button>
            <button 
                onClick={() => setIsCertModalOpen(true)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    certificate ? 'bg-green-600/20 text-green-600 dark:text-green-400 border border-green-600/50' : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white'
                }`}
            >
                {certificate ? `✅ ${t('invoices.certificate_active')}` : `⚙️ ${t('invoices.configure_certificate')}`}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('invoices.issued_month')}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('invoices.total_amount')}</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('invoices.plan_franchise')}</h3>
            <div className="flex items-end gap-2 mb-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                <p className="text-gray-500 dark:text-gray-400 mb-1">/ {franchiseLimit} {t('invoices.table.number')}</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${franchiseUsedPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('invoices.renews_on')} 01/01/2026</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
            <h2 className="font-semibold text-gray-900 dark:text-white">{t('invoices.history')}</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm">
                    <tr>
                        <th className="p-4">{t('invoices.table.number')}</th>
                        <th className="p-4">{t('invoices.table.date')}</th>
                        <th className="p-4">{t('invoices.table.client')}</th>
                        <th className="p-4">{t('invoices.table.value')}</th>
                        <th className="p-4">{t('invoices.table.status')}</th>
                        <th className="p-4">{t('invoices.table.actions')}</th>
                    </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                    {invoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-purple-600 dark:text-purple-400">{inv.id}</td>
                            <td className="p-4">{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 align-middle text-sm text-gray-800 dark:text-gray-300 max-w-[200px] truncate">{inv.client}</td>
                            <td className="p-4 align-middle text-sm text-gray-800 dark:text-gray-300 font-mono">
                                {inv.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-4 align-middle text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    inv.status === 'issued' 
                                    ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                                    : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
                                }`}>
                                    {inv.status === 'issued' ? t('invoices.status.issued') : t('invoices.status.pending')}
                                </span>
                            </td>
                            <td className="p-4 align-middle text-right space-x-2">
                                <button 
                                    onClick={() => generatePDF(inv)}
                                    className="p-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors"
                                    title="Baixar PDF"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => handleDeleteInvoice(inv.id, inv.originalId)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
