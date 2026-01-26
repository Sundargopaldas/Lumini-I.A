import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import IssueInvoiceModal from '../components/IssueInvoiceModal';
import CustomAlert from '../components/CustomAlert';
import api from '../services/api';

// Função helper para normalizar caracteres especiais para PDF
const normalizeForPDF = (text) => {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[ÀÁÂÃÄÅ]/g, 'A')
    .replace(/[ÈÉÊË]/g, 'E')
    .replace(/[ÌÍÎÏ]/g, 'I')
    .replace(/[ÒÓÔÕÖ]/g, 'O')
    .replace(/[ÙÚÛÜ]/g, 'U')
    .replace(/[Ç]/g, 'C')
    .replace(/[Ñ]/g, 'N');
};

const Invoices = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremium = user.plan === 'premium';
  
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
        const response = await api.get('/certificates/status');
        if (response.data && response.data.configured) {
            setCertificate(response.data);
        } else {
            setCertificate(null);
        }
    } catch (error) {
        // It's okay if not found (404) or error
        console.log('Certificate status check:', error.response?.status === 404 ? 'Not configured' : error.message);
        setCertificate(null);
    }
  };

  useEffect(() => {
    if (isPremium) {
        fetchInvoices();
        fetchCertificate();
    }
  }, [isPremium]);


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
  const totalAmount = invoices.reduce((acc, inv) => acc + (parseFloat(inv.amount) || 0), 0);
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
        // Verificação de segurança ROBUSTA
        if (!code || typeof code !== 'string' || code.length === 0) {
            console.warn('drawBarcode: código inválido ou indefinido', code);
            // Desenhar texto de erro em vez de quebrar
            doc.setFontSize(8);
            doc.setTextColor(200, 0, 0);
            doc.text('Código de barras indisponível', x + (width/2), y + (height/2), { align: 'center' });
            doc.setTextColor(0, 0, 0); // Reset color
            return;
        }
        
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
        
        // Code text - com verificação adicional
        doc.setFontSize(9);
        doc.setFont('courier', 'bold');
        try {
            const formattedCode = code.match(/.{1,4}/g);
            if (formattedCode) {
                doc.text(formattedCode.join(' '), x + (width/2), y + height + 4, { align: 'center' });
            } else {
                doc.text(code, x + (width/2), y + height + 4, { align: 'center' });
            }
        } catch (error) {
            console.error('Erro ao formatar código de barras:', error);
            doc.text(code, x + (width/2), y + height + 4, { align: 'center' });
        }
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
    
    const title = invoice.type === 'receipt' ? 'RECIBO DE PAGAMENTO' : normalizeForPDF(t('invoices.pdf.nfse_title').toUpperCase());
    doc.text(title, 105, 22, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let subTitle = '';
    if (invoice.type === 'receipt') {
        subTitle = normalizeForPDF(`Documento Auxiliar de Venda - Nao possui valor fiscal`);
    } else {
        subTitle = normalizeForPDF(t('invoices.pdf.rps_text', { 
            number: invoice.id.toString().padStart(6, '0'), 
            date: new Date(invoice.date || new Date()).toLocaleDateString(i18n.language) 
        }));
    }
    doc.text(subTitle, 105, 32, { align: 'center' });
    
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
    doc.text(invoice.type === 'receipt' ? 'RECIBO Nº' : t('invoices.pdf.note_number'), 41.5, y+5, { align: 'center' });
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

    // Col 3: Codigo Verificacao / Status
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    
    if (invoice.type === 'receipt') {
        doc.text('TIPO', 168, y+5, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('RECIBO', 168, y+12, { align: 'center' });
    } else {
        doc.text(t('invoices.pdf.verification_code'), 168, y+5, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        const mockHash = `A${invoice.id}B-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        doc.text(mockHash, 168, y+12, { align: 'center' });
    }

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
    doc.text(normalizeForPDF(user.name || t('invoices.pdf.provider_name_fallback')), leftMargin, y+11);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const cpfCnpj = user.cpfCnpj || '00.000.000/0001-00';
    doc.text(`CPF/CNPJ: ${cpfCnpj}`, leftMargin, y+16);
    doc.text(`Email: ${user.email}`, leftMargin, y+21);
    doc.text(normalizeForPDF(`Endereco: ${user.address || t('invoices.pdf.not_informed')}`), leftMargin, y+26);


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
    doc.text(normalizeForPDF(invoice.client || t('invoices.pdf.client_not_identified')), 15, y+11);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`CPF/CNPJ: ${invoice.clientDocument || t('invoices.pdf.not_informed')}`, 15, y+16);
    doc.text(`Email: ${invoice.clientEmail || t('invoices.pdf.not_informed')}`, 15, y+21);
    doc.text(normalizeForPDF(`Endereco: ${invoice.clientAddress || t('invoices.pdf.not_informed')}`), 15, y+26);

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
    const splitText = doc.splitTextToSize(normalizeForPDF(invoice.service || ''), 180);
    doc.text(splitText, 15, y+12);

    // --- VALORES E IMPOSTOS (SIMULADO) ---
    y += 52;
    doc.rect(10, y, 190, 20);
    
    // Header Row
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(10, y, 190, 6, 'F');
    
    // Check if it is a receipt or official invoice
    if (invoice.type === 'receipt') {
        // --- RECEIPT LAYOUT ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        
        // Single row for Total Value
        doc.text('VALOR TOTAL', 105, y+4, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(invoice.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}), 105, y+14, { align: 'center' });
        
        // --- SIGNATURE AREA ---
        y += 35;
        doc.line(60, y, 150, y); // Signature line
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Assinatura do Emissor', 105, y+5, { align: 'center' });

        // Footer
        y += 15;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text(normalizeForPDF('Este recibo nao substitui a Nota Fiscal de Servicos (NFS-e).'), 105, y, { align: 'center' });
        
    } else {
        // --- OFFICIAL INVOICE LAYOUT ---
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
        doc.text(normalizeForPDF('Documento emitido por ME ou EPP optante pelo Simples Nacional.'), 105, y, { align: 'center' });
        doc.text(normalizeForPDF('Nao gera direito a credito fiscal de IPI.'), 105, y+4, { align: 'center' });
        
        // --- BARCODE ---
        y += 8;
        // Use invoice Access Key if available, or generate a valid-looking 44 digit mock
        const randomDigits = (len) => Array.from({length: len}, () => Math.floor(Math.random()*10)).join('');
        const accessKey = invoice.nfeAccessKey || `35${new Date().getFullYear()}${randomDigits(38)}`;
        drawBarcode(50, y, 110, 15, accessKey); // Centered barcode
    }

    // Save
    const fileName = invoice.type === 'receipt' ? `Recibo-${invoice.id}.pdf` : `NFS-e-${invoice.id}.pdf`;
    doc.save(fileName);

  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-purple-600/10 dark:bg-purple-600/20 p-6 rounded-full">
            <span className="text-6xl">🧾</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg">
          {t('invoices.subtitle')}
        </p>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 max-w-md w-full text-left space-y-3 shadow-lg dark:shadow-none">
            <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                <span>✨</span> {t('invoices.premium_title')}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2">✅ {t('invoices.feature_1')}</li>
                <li className="flex gap-2">✅ {t('invoices.feature_2')}</li>
                <li className="flex gap-2">✅ {t('invoices.feature_3')}</li>
                <li className="flex gap-2">✅ {t('invoices.feature_4')}</li>
            </ul>
        </div>

        <Link 
          to="/plans" 
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1"
        >
          {t('invoices.upgrade_button')}
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
      
      <IssueInvoiceModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onIssue={handleIssueInvoice}
        hasCertificate={certificate !== null}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div>
            <h1 className="text-2xl md:text-3xl ipad-air:text-4xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
            <button 
                onClick={() => setIsIssueModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 sm:gap-2 shadow-lg shadow-purple-500/20 whitespace-nowrap"
            >
                <span className="text-lg">+</span> 
                <span className="hidden sm:inline">{t('invoices.issue_invoice')}</span>
                <span className="sm:hidden">Emitir</span>
            </button>
            <button 
                onClick={() => navigate('/settings?tab=fiscal')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                    certificate ? 'bg-green-600/20 text-green-600 dark:text-green-400 border border-green-600/50' : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white'
                }`}
            >
                <span>{certificate ? '✅' : '⚙️'}</span>
                <span className="hidden md:inline">{certificate ? t('invoices.certificate_active') : t('invoices.configure_certificate')}</span>
                <span className="md:hidden">{certificate ? 'Ativo' : 'Config'}</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 ipad-air:gap-7">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 md:p-6 ipad-air:p-7 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm ipad-air:text-base mb-1">{t('invoices.issued_month')}</h3>
            <p className="text-2xl md:text-3xl ipad-air:text-4xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 md:p-6 ipad-air:p-7 rounded-xl shadow-sm dark:shadow-none">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm ipad-air:text-base mb-1">{t('invoices.total_amount')}</h3>
            <p className="text-2xl md:text-3xl ipad-air:text-4xl font-bold text-green-600 dark:text-green-400 break-all">
                {(totalAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 md:p-6 ipad-air:p-7 rounded-xl shadow-sm dark:shadow-none sm:col-span-2 lg:col-span-1">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm ipad-air:text-base mb-1">{t('invoices.plan_franchise')}</h3>
            <div className="flex items-end gap-2 mb-2">
                <p className="text-2xl md:text-3xl ipad-air:text-4xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                <p className="text-gray-500 dark:text-gray-400 mb-1 text-sm">/ {franchiseLimit}</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${franchiseUsedPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('invoices.renews_on')} 01/01/2026</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden max-w-full">
        <div className="p-4 md:p-6 ipad-air:p-7 border-b border-gray-200 dark:border-white/10">
            <h2 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg ipad-air:text-xl">{t('invoices.history')}</h2>
        </div>

        {/* Layout DESKTOP - Tabela (apenas em monitores grandes ≥1536px) */}
        <div className="hidden 2xl:block overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm">
                    <tr>
                        <th className="p-4">{t('invoices.table.number')}</th>
                        <th className="p-4">{t('invoices.table.date')}</th>
                        <th className="p-4">{t('invoices.table.client')}</th>
                        <th className="p-4">{t('invoices.table.value')}</th>
                        <th className="p-4">{t('invoices.table.status')}</th>
                        <th className="p-4 text-right">{t('invoices.table.actions')}</th>
                    </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                    {invoices.map((inv) => (
                        <tr key={inv.id} className="border-t border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-purple-600 dark:text-purple-400">
                                <div className="flex flex-col">
                                    <span>{inv.id}</span>
                                    <span className="text-[10px] uppercase text-gray-400">{inv.type === 'receipt' ? 'Recibo' : 'NFS-e'}</span>
                                </div>
                            </td>
                            <td className="p-4">{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 max-w-[200px] truncate">{inv.client}</td>
                            <td className="p-4 font-mono">
                                {(inv.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    inv.status === 'issued' 
                                    ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                                    : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
                                }`}>
                                    {inv.status === 'issued' ? t('invoices.status.issued') : t('invoices.status.pending')}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button 
                                    onClick={() => navigate(`/invoices/${inv.originalId}`)}
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors inline-flex"
                                    title="Ver Nota Fiscal (DANFE Profissional)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => handleDeleteInvoice(inv.id, inv.originalId)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
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

        {/* Layout MOBILE e TABLET - Cards (até 1536px - todos iPads) */}
        <div className="2xl:hidden">
            {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-6 rounded-full mb-6">
                        <svg className="w-16 h-16 md:w-20 md:h-20 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl md:text-2xl ipad-air:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Nenhuma Nota Fiscal Emitida
                    </h3>
                    <p className="text-sm md:text-base ipad-air:text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-md text-center">
                        Comece a emitir suas notas fiscais eletrônicas (NFS-e) e gerencie seus documentos fiscais de forma profissional.
                    </p>
                    <button 
                        onClick={() => setIsIssueModalOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Emitir Primeira Nota
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ipad-air:gap-5 p-3 md:p-4 ipad-air:p-6 max-w-full">
                    {invoices.map((inv) => (
                        <div key={inv.id} className="border border-gray-200 dark:border-white/10 rounded-lg p-3 md:p-4 ipad-air:p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all hover:shadow-md dark:hover:shadow-lg min-w-0">
                            {/* Cabeçalho do Card: Número, Tipo e Status */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-mono text-base md:text-lg font-bold text-purple-600 dark:text-purple-400">
                                            {inv.id}
                                        </span>
                                        <span className="text-[10px] md:text-xs uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold whitespace-nowrap">
                                            {inv.type === 'receipt' ? 'Recibo' : 'NFS-e'}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                        📅 {new Date(inv.date).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap shrink-0 ${
                                    inv.status === 'issued' 
                                    ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                                    : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
                                }`}>
                                    {inv.status === 'issued' ? '✓ Emitida' : '⏳ Pendente'}
                                </span>
                            </div>

                            {/* Cliente */}
                            <div className="mb-3 pb-3 border-b border-gray-100 dark:border-white/5">
                                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">👤 Cliente</p>
                                <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white break-words line-clamp-2" title={inv.client}>
                                    {inv.client}
                                </p>
                            </div>

                            {/* Rodapé: Valor e Ações */}
                            <div className="flex items-end justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">💰 Valor</p>
                                    <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400 truncate">
                                        {(inv.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button 
                                        onClick={() => navigate(`/invoices/${inv.originalId}`)}
                                        className="p-2 md:p-2.5 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                                        title="Ver Nota Fiscal"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteInvoice(inv.id, inv.originalId)}
                                        className="p-2 md:p-2.5 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
