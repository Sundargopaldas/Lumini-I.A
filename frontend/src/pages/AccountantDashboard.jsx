import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUser } from '../utils/storage';
import CustomAlert from '../components/CustomAlert';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AccountantDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getUser();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, clients, profile, invites, notifications, documents
  const [stats, setStats] = useState(null);
  const [accountantProfile, setAccountantProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientReport, setClientReport] = useState(null);
  const [loadingClientReport, setLoadingClientReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [lastNotificationId, setLastNotificationId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications(); // Buscar notificações ao carregar

    // Polling de notificações a cada 30 segundos
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas agregadas
      const statsRes = await api.get('/accountants/dashboard/stats');
      setStats(statsRes.data);
      setAccountantProfile(statsRes.data.accountantProfile || null);
      
      if (statsRes.data.accountantProfile?.logo) {
        console.log('✅ Logo do contador carregada:', statsRes.data.accountantProfile.logo);
      } else {
        console.log('⚠️ Logo do contador não encontrada');
      }

      // Buscar lista de clientes
      const clientsRes = await api.get('/accountants/me/clients');
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        // Não é contador ainda
        showAlert('Acesso Negado', 'Você precisa criar um perfil de contador no Marketplace primeiro.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlert({ show: true, title, message, type, onConfirm });
  };

  const handleInviteClient = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await api.post('/accountants/invite-client', { email: inviteEmail });
      showAlert('Convite Enviado', res.data.message, 'success');
      setInviteEmail('');
    } catch (error) {
      showAlert('Erro', error.response?.data?.message || 'Erro ao enviar convite', 'error');
    }
  };

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    setActiveTab('client-detail');
    await fetchClientReport(client.id);
  };

  const fetchClientReport = async (clientId) => {
    try {
      setLoadingClientReport(true);
      const response = await api.get(`/accountants/client/${clientId}/report`);
      setClientReport(response.data);
    } catch (error) {
      console.error('Error fetching client report:', error);
      showAlert('Erro', 'Erro ao carregar relatório do cliente', 'error');
    } finally {
      setLoadingClientReport(false);
    }
  };

  const fetchNotifications = async (silent = true) => {
    try {
      const response = await api.get('/accountants/notifications');
      const newNotifications = response.data;
      
      // Calcular não lidas
      const unread = newNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);

      // Verificar se há novas notificações
      if (newNotifications.length > 0 && lastNotificationId) {
        const hasNewNotifications = newNotifications.some(n => n.id > lastNotificationId && !n.read);
        
        if (hasNewNotifications && !silent) {
          // Tocar som de notificação
          playNotificationSound();
          
          // Mostrar toast/alert
          showAlert('Nova Notificação', 'Você tem novas notificações!', 'info');
        }
      }

      // Atualizar último ID
      if (newNotifications.length > 0) {
        setLastNotificationId(Math.max(...newNotifications.map(n => n.id)));
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      // Som simples usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/accountants/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.patch(`/accountants/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/accountants/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
      setUnreadCount(0);
      showAlert('Sucesso', 'Todas as notificações foram marcadas como lidas', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showAlert('Erro', 'Erro ao marcar notificações como lidas', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/accountants/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Atualizar contador de não lidas
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      showAlert('Sucesso', 'Notificação deletada', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showAlert('Erro', 'Erro ao deletar notificação', 'error');
    }
  };

  const exportClientReport = async () => {
    if (!selectedClient || !clientReport) return;

    console.log('🔍 [PDF] accountantProfile:', accountantProfile);
    console.log('🔍 [PDF] Logo do contador:', accountantProfile?.logo);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const normalize = (text) => {
        if (!text) return '';
        
        // PRIMEIRO: Remover TODOS os emojis e símbolos especiais
        let normalized = String(text)
          // Remove emojis (todos os ranges Unicode de emojis)
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis diversos
          .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos diversos
          .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
          .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
          .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte e mapas
          .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Símbolos suplementares
          .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variação de seletor
          .replace(/[\u{200D}]/gu, '')            // Zero width joiner
          .replace(/[\u{E0020}-\u{E007F}]/gu, '') // Tags
          .trim();
        
        // SEGUNDO: Mapa de acentos para seus equivalentes
        const map = {
          'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a', 'å': 'a',
          'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
          'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
          'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
          'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
          'ç': 'c', 'ñ': 'n',
          'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A', 'Å': 'A',
          'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
          'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
          'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
          'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
          'Ç': 'C', 'Ñ': 'N'
        };
        
        return normalized.split('').map(char => map[char] || char).join('');
      };
      
      let yPos = 20;

      // ===== HEADER PREMIUM COM GRADIENTE ELEGANTE =====
      // Gradiente em 3 camadas (roxo profissional)
      doc.setFillColor(109, 40, 217); // Purple 700
      doc.rect(0, 0, pageWidth, 65, 'F');
      doc.setFillColor(124, 58, 237); // Purple 600
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setFillColor(139, 92, 246); // Purple 500
      doc.rect(0, 0, pageWidth, 55, 'F');
      
      // Elementos decorativos (círculos sutis)
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({opacity: 0.08}));
      doc.circle(pageWidth - 25, 20, 30, 'F');
      doc.circle(pageWidth - 45, 45, 20, 'F');
      doc.circle(20, 15, 15, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      // Logo do contador (se existir)
      let logoAdded = false;
      
      if (accountantProfile?.logo) {
        console.log('✅ [LOGO] Carregando logo:', accountantProfile.logo);
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          // Construir URL completa
          let logoUrl = accountantProfile.logo;
          if (!logoUrl.startsWith('http')) {
            // Se começa com /, é caminho absoluto
            logoUrl = logoUrl.startsWith('/') 
              ? `${window.location.origin}${logoUrl}`
              : `${window.location.origin}/${logoUrl}`;
          }
          
          console.log('🌐 [LOGO] URL completa:', logoUrl);
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
            img.onload = () => {
              clearTimeout(timeout);
              try {
                const canvas = document.createElement('canvas');
                // 🔥 ALTA QUALIDADE: Canvas grande para melhor resolução
                const size = 512;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { alpha: true });
                
                if (ctx && img.complete && img.naturalWidth > 0) {
                  // 🎨 Melhorar qualidade da renderização
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  
                  // Desenhar com proporção mantida
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  let drawWidth = size;
                  let drawHeight = size;
                  let offsetX = 0;
                  let offsetY = 0;
                  
                  if (aspectRatio > 1) {
                    drawHeight = size / aspectRatio;
                    offsetY = (size - drawHeight) / 2;
                  } else {
                    drawWidth = size * aspectRatio;
                    offsetX = (size - drawWidth) / 2;
                  }
                  
                  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                  
                  // 📸 Exportar com MÁXIMA qualidade
                  const logoData = canvas.toDataURL('image/png', 1.0);
                  
                  if (logoData && logoData.length > 100) {
                    // Logo em ALTA RESOLUÇÃO (sem background)
                    doc.addImage(logoData, 'PNG', 17, 12, 26, 26);
                    logoAdded = true;
                    console.log('✅ [LOGO] Logo HD adicionada ao PDF!');
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                } else {
                  resolve(false);
                }
              } catch (e) {
                console.warn('Erro ao processar logo do contador:', e);
                resolve(false);
              }
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve(false);
            };
            img.src = logoUrl;
          });
        } catch (e) {
          console.error('❌ [LOGO] Erro:', e);
        }
      } else {
        console.log('⚠️ [LOGO] Campo logo está vazio ou null');
      }
      
      // Se não carregou a logo, usar placeholder elegante (sem círculo)
      if (!logoAdded) {
        console.log('🔤 [LOGO] Usando inicial:', (accountantProfile?.businessName || accountantProfile?.name || 'Contador').charAt(0));
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const businessName = accountantProfile?.businessName || accountantProfile?.name || 'Contador';
        const initial = normalize(businessName).charAt(0).toUpperCase();
        doc.text(initial, 26, 29);
      }
      
      // Título principal com nome do contador
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const reportTitle = accountantProfile?.businessName || accountantProfile?.name || 'Relatorio do Cliente';
      doc.text(normalize(reportTitle), 48, 22);
      
      // Subtitle
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setGState(doc.GState({opacity: 0.95}));
      doc.text(normalize('Analise Financeira Profissional'), 48, 31);
      doc.setGState(doc.GState({opacity: 1}));
      
      // Data de geração
      doc.setFontSize(8);
      doc.setGState(doc.GState({opacity: 0.85}));
      doc.text(normalize(`Emitido em ${new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`), 48, 39);
      doc.setGState(doc.GState({opacity: 1}));
      
      // Linha decorativa
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.5);
      doc.setGState(doc.GState({opacity: 0.4}));
      doc.line(14, 52, pageWidth - 14, 52);
      doc.setGState(doc.GState({opacity: 1}));
      
      yPos = 68;

      // ===== CLIENT INFO CARD (ULTRA MODERNO) =====
      // Sombra
      doc.setFillColor(200, 200, 200);
      doc.setGState(doc.GState({opacity: 0.2}));
      doc.rect(15, yPos - 4, pageWidth - 28, 42, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      // Background
      doc.setFillColor(255, 255, 255);
      doc.rect(14, yPos - 5, pageWidth - 28, 42, 'F');
      
      // Borda superior colorida
      doc.setFillColor(99, 102, 241); // Indigo
      doc.rect(14, yPos - 5, pageWidth - 28, 4, 'F');
      
      // Borda do card
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(14, yPos - 5, pageWidth - 28, 42);
      
      // Avatar do cliente
      doc.setFillColor(99, 102, 241);
      doc.setGState(doc.GState({opacity: 0.15}));
      doc.circle(24, yPos + 10, 8, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      const clientName = selectedClient.name || selectedClient.username || 'Cliente';
      const initial = normalize(clientName).charAt(0).toUpperCase();
      doc.text(initial, 21, yPos + 13);
      
      // Info do cliente
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(normalize(selectedClient.name || selectedClient.username), 36, yPos + 5);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(normalize(`Email: ${selectedClient.email}`), 36, yPos + 12);
      
      if (clientReport.client?.cpfCnpj) {
        doc.text(normalize(`CPF/CNPJ: ${clientReport.client.cpfCnpj}`), 36, yPos + 18);
      }
      
      // Badge do plano
      const planX = pageWidth - 40;
      const planColors = {
        premium: [147, 51, 234],
        pro: [59, 130, 246],
        free: [107, 114, 128]
      };
      const planColor = planColors[selectedClient.plan] || planColors.free;
      
      doc.setFillColor(...planColor);
      doc.rect(planX, yPos + 2, 26, 8, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(normalize((selectedClient.plan || 'FREE').toUpperCase()), planX + 13, yPos + 7, { align: 'center' });
      
      yPos += 44;

      // ===== SUMMARY CARDS (DESIGN PREMIUM) =====
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(normalize('Resumo Financeiro (12 meses)'), 14, yPos);
      yPos += 12;
      
      const cardW = (pageWidth - 40) / 3;
      const cardH = 35;
      const spacing = 13;
      
      // Receitas
      const c1X = 14;
      doc.setFillColor(220, 220, 220);
      doc.setGState(doc.GState({opacity: 0.12}));
      doc.rect(c1X + 1, yPos + 1, cardW, cardH, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      doc.setFillColor(236, 253, 245); // Green 50
      doc.rect(c1X, yPos, cardW, cardH, 'F');
      doc.setFillColor(16, 185, 129);
      doc.rect(c1X, yPos, 3, cardH, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(normalize('RECEITAS'), c1X + 8, yPos + 8);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(normalize(`R$ ${parseFloat(clientReport.financials?.incomeBySource?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`), c1X + 8, yPos + 22);
      
      // Despesas
      const c2X = c1X + cardW + spacing;
      doc.setFillColor(220, 220, 220);
      doc.setGState(doc.GState({opacity: 0.12}));
      doc.rect(c2X + 1, yPos + 1, cardW, cardH, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      doc.setFillColor(254, 242, 242); // Red 50
      doc.rect(c2X, yPos, cardW, cardH, 'F');
      doc.setFillColor(239, 68, 68);
      doc.rect(c2X, yPos, 3, cardH, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(normalize('DESPESAS'), c2X + 8, yPos + 8);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(normalize(`R$ ${parseFloat(clientReport.financials?.expensesByCategory?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`), c2X + 8, yPos + 22);
      
      // Lucro
      const c3X = c2X + cardW + spacing;
      const profit = parseFloat(clientReport.financials?.incomeBySource?.total || 0) - parseFloat(clientReport.financials?.expensesByCategory?.total || 0);
      const profitColor = profit >= 0 ? [139, 92, 246] : [239, 68, 68];
      const profitBg = profit >= 0 ? [245, 243, 255] : [254, 242, 242];
      
      doc.setFillColor(220, 220, 220);
      doc.setGState(doc.GState({opacity: 0.12}));
      doc.rect(c3X + 1, yPos + 1, cardW, cardH, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      doc.setFillColor(...profitBg);
      doc.rect(c3X, yPos, cardW, cardH, 'F');
      doc.setFillColor(...profitColor);
      doc.rect(c3X, yPos, 3, cardH, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(normalize('LUCRO'), c3X + 8, yPos + 8);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...profitColor);
      doc.text(normalize(`R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`), c3X + 8, yPos + 22);
      
      yPos += cardH + 16;

      // ===== TRANSACTIONS TABLE (ESTILO MODERNO) =====
      if (clientReport.transactions && clientReport.transactions.length > 0) {
        // Section header
        doc.setFillColor(99, 102, 241);
        doc.rect(14, yPos - 5, pageWidth - 28, 11, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(normalize('Ultimas Transacoes'), 18, yPos + 1);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setGState(doc.GState({opacity: 0.9}));
        doc.text(`${clientReport.transactions.length} registros`, pageWidth - 35, yPos + 1);
        doc.setGState(doc.GState({opacity: 1}));
        
        yPos += 8;
        
        const transactions = (clientReport.transactions || []).slice(0, 25).map(t => [
          new Date(t.date).toLocaleDateString('pt-BR'),
          normalize((t.description || 'Sem descricao').substring(0, 30)),
          t.type === 'income' ? 'Receita' : 'Despesa',
          normalize(`R$ ${parseFloat(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        ]);

        doc.autoTable({
          startY: yPos,
          head: [[normalize('Data'), normalize('Descricao'), 'Tipo', 'Valor']],
          body: transactions,
          theme: 'striped',
          headStyles: { 
            fillColor: [139, 92, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          styles: {
            fontSize: 8,
            cellPadding: 4
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
          }
        });
      }

      // ===== FOOTER PREMIUM =====
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Background do footer
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
        
        // Linha superior gradiente
        doc.setFillColor(139, 92, 246);
        doc.rect(0, pageHeight - 25, pageWidth / 2, 2, 'F');
        doc.setFillColor(99, 102, 241);
        doc.rect(pageWidth / 2, pageHeight - 25, pageWidth / 2, 2, 'F');
        
        // Logo + Nome (esquerda)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text(normalize('Lumini I.A'), 14, pageHeight - 15);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(normalize('Dashboard do Contador'), 19, pageHeight - 10);
        
        // Paginação (centro)
        doc.setFillColor(139, 92, 246);
        doc.setGState(doc.GState({opacity: 0.1}));
        doc.rect(pageWidth / 2 - 12, pageHeight - 18, 24, 7, 'F');
        doc.setGState(doc.GState({opacity: 1}));
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(139, 92, 246);
        doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 13, { align: 'center' });
        
        // Info (direita)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        const footerDate = new Date().toLocaleDateString('pt-BR');
        doc.text(footerDate, pageWidth - 14, pageHeight - 15, { align: 'right' });
        
        doc.setFontSize(6);
        doc.setTextColor(139, 92, 246);
        doc.text('luminiiadigital.com.br', pageWidth - 14, pageHeight - 10, { align: 'right' });
      }

      doc.save(normalize(`relatorio-cliente-${selectedClient.name || selectedClient.username}-${new Date().toISOString().split('T')[0]}.pdf`));
      showAlert('Sucesso', 'Relatório gerado com sucesso!', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showAlert('Erro', 'Erro ao gerar relatório PDF', 'error');
    }
  };

  const uploadDocument = async (file, clientId) => {
    try {
      console.log('🔍 [FRONTEND] Iniciando upload...');
      console.log('🔍 [FRONTEND] Arquivo:', file.name, file.type, file.size);
      console.log('🔍 [FRONTEND] ClientId:', clientId);
      
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('clientId', clientId);

      console.log('🔍 [FRONTEND] FormData criado, enviando...');

      const response = await api.post('/accountants/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ [FRONTEND] Upload sucesso:', response.data);
      showAlert('Sucesso', 'Documento enviado com sucesso!', 'success');
      await fetchDocuments();
    } catch (error) {
      console.error('❌ [FRONTEND] Erro completo:', error);
      console.error('❌ [FRONTEND] Response:', error.response?.data);
      console.error('❌ [FRONTEND] Status:', error.response?.status);
      showAlert('Erro', error.response?.data?.message || 'Erro ao enviar documento', 'error');
    } finally {
      setUploadingDocument(false);
    }
  };

  const downloadDocument = async (documentId, filename) => {
    try {
      console.log('🔍 [DOWNLOAD FRONTEND] Iniciando download...');
      console.log('🔍 [DOWNLOAD FRONTEND] Document ID:', documentId);
      console.log('🔍 [DOWNLOAD FRONTEND] Filename:', filename);
      
      setDownloadingDoc(documentId);
      const response = await api.get(`/accountants/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      console.log('✅ [DOWNLOAD FRONTEND] Blob recebido, criando link...');
      
      // Criar link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ [DOWNLOAD FRONTEND] Download concluído!');
      showAlert('Sucesso', 'Documento baixado com sucesso!', 'success');
    } catch (error) {
      console.error('❌ [DOWNLOAD FRONTEND] Erro completo:', error);
      console.error('❌ [DOWNLOAD FRONTEND] Response:', error.response?.data);
      console.error('❌ [DOWNLOAD FRONTEND] Status:', error.response?.status);
      showAlert('Erro', error.response?.data?.message || 'Erro ao baixar documento', 'error');
    } finally {
      setDownloadingDoc(null);
    }
  };

  const confirmDeleteDocument = (documentId, filename) => {
    showAlert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar "${filename}"?`,
      'confirm',
      () => deleteDocument(documentId, filename)
    );
  };

  const deleteDocument = async (documentId, filename) => {
    try {
      console.log('🔍 [DELETE FRONTEND] Iniciando deleção...');
      console.log('🔍 [DELETE FRONTEND] Document ID:', documentId);
      
      setDeletingDoc(documentId);
      await api.delete(`/accountants/documents/${documentId}`);
      
      console.log('✅ [DELETE FRONTEND] Documento deletado!');
      showAlert('Sucesso', 'Documento deletado com sucesso!', 'success');
      await fetchDocuments();
    } catch (error) {
      console.error('❌ [DELETE FRONTEND] Erro completo:', error);
      console.error('❌ [DELETE FRONTEND] Response:', error.response?.data);
      console.error('❌ [DELETE FRONTEND] Status:', error.response?.status);
      showAlert('Erro', error.response?.data?.message || 'Erro ao deletar documento', 'error');
    } finally {
      setDeletingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">👨‍💼</div>
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
            Complete seu Perfil de Contador
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Para acessar o Dashboard do Contador, você precisa criar seu perfil profissional no Marketplace.
          </p>
          <Link
            to="/marketplace"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Criar Perfil de Contador
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Alert Modal - Renderizado fora do container principal */}
      <CustomAlert 
        isOpen={alert.show}
        onClose={() => setAlert(prev => ({ ...prev, show: false, onConfirm: null }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
      />
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Dashboard do Contador</h1>
                <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                  👥 Área Profissional
                </span>
              </div>
              <p className="text-purple-100">Gerencie seus clientes e relatórios financeiros</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/marketplace"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Meu Perfil Público
              </Link>
              <div className="relative group">
                <Link
                  to="/dashboard"
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Minhas Finanças
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
                <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="font-semibold mb-1">💡 Área Pessoal</p>
                  <p>
                    Gerencie suas <strong>próprias</strong> transações e finanças. 
                    Como contador, você também pode usar a plataforma para suas finanças pessoais!
                  </p>
                  <div className="absolute -top-2 right-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-slate-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Novo Cliente - CHAMATIVO */}
        {notifications.filter(n => n.type === 'new_client' && !n.read).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 relative"
          >
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-xl p-6 shadow-2xl border-2 border-green-400 relative overflow-hidden">
              {/* Animação de brilho */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-5xl animate-bounce">🎉</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      Novo Cliente Vinculado!
                      <span className="px-3 py-1 bg-white/30 text-white text-sm rounded-full animate-pulse">
                        {notifications.filter(n => n.type === 'new_client' && !n.read).length}
                      </span>
                    </h3>
                    <div className="space-y-1">
                      {notifications
                        .filter(n => n.type === 'new_client' && !n.read)
                        .slice(0, 3)
                        .map(notif => (
                          <p key={notif.id} className="text-white/90 text-base flex items-center gap-2">
                            <span className="text-xl">👤</span>
                            <strong>{notif.metadata?.clientName || 'Cliente'}</strong> se vinculou ao seu perfil!
                          </p>
                        ))
                      }
                    </div>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className="mt-3 px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors text-sm shadow-md"
                    >
                      Ver Detalhes →
                    </button>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    // Marcar todas as notificações de novo cliente como lidas
                    const newClientNotifs = notifications.filter(n => n.type === 'new_client' && !n.read);
                    for (const notif of newClientNotifs) {
                      await markNotificationAsRead(notif.id);
                    }
                  }}
                  className="text-white/80 hover:text-white transition-colors text-2xl"
                  title="Dispensar"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-6 p-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            📊 Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            👥 Clientes ({clients.length})
          </button>
          <button
            onClick={() => { setActiveTab('notifications'); fetchNotifications(false); }}
            className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'notifications'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            🔔 Notificações
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('documents'); fetchDocuments(); }}
            className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            📁 Documentos
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'invites'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            ✉️ Convites
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            ⚙️ Perfil
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Welcome Info Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">👋</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Bem-vindo à sua Área Profissional de Contador!
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    Aqui você gerencia seus <strong>clientes</strong> e acessa relatórios financeiros deles.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        <strong className="text-purple-600 dark:text-purple-400">Dashboard do Contador</strong>: Gerencie clientes
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        <strong className="text-blue-600 dark:text-blue-400">Minhas Finanças</strong>: Suas transações pessoais
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const banner = document.querySelector('.welcome-banner');
                    if (banner) banner.style.display = 'none';
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Fechar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total de Clientes</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stats.overview?.totalClients || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.overview?.activeClients || 0} ativos
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Receita Total (30d)</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      R$ {parseFloat(stats.overview?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Despesas (30d)</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      R$ {parseFloat(stats.overview?.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lucro Líquido</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      R$ {parseFloat(stats.overview?.netIncome || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Últimos 30 dias</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              {stats.recentActivity && stats.recentActivity.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">📈 Evolução dos Últimos 7 Dias</h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: stats.recentActivity.map(item => new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
                        datasets: [
                          {
                            label: 'Receitas',
                            data: stats.recentActivity.map(item => parseFloat(item.revenue)),
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'Despesas',
                            data: stats.recentActivity.map(item => parseFloat(item.expenses)),
                            borderColor: 'rgb(239, 68, 68)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            labels: {
                              color: 'rgb(100, 116, 139)',
                              font: { size: 12 }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return context.dataset.label + ': R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              color: 'rgb(100, 116, 139)',
                              callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                              }
                            },
                            grid: {
                              color: 'rgba(100, 116, 139, 0.1)'
                            }
                          },
                          x: {
                            ticks: {
                              color: 'rgb(100, 116, 139)'
                            },
                            grid: {
                              color: 'rgba(100, 116, 139, 0.1)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Clients by Plan Pie Chart */}
              {stats.clientsByPlan && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">👥 Clientes por Plano</h3>
                  <div className="h-64 flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: Object.keys(stats.clientsByPlan).map(plan => plan.toUpperCase()),
                        datasets: [{
                          data: Object.values(stats.clientsByPlan),
                          backgroundColor: [
                            'rgba(147, 51, 234, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(249, 115, 22, 0.8)'
                          ],
                          borderColor: [
                            'rgb(147, 51, 234)',
                            'rgb(59, 130, 246)',
                            'rgb(34, 197, 94)',
                            'rgb(249, 115, 22)'
                          ],
                          borderWidth: 2
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              color: 'rgb(100, 116, 139)',
                              padding: 15,
                              font: { size: 12 }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return context.label + ': ' + context.parsed + ' clientes';
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Alerts */}
            {stats.alerts && stats.alerts.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-yellow-500">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  ⚠️ Alertas e Pendências
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.alerts.length}
                  </span>
                </h3>

                <div className="space-y-3">
                  {stats.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="text-2xl">📝</div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {alert.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Cliente: <strong>{alert.clientName}</strong> • {new Date(alert.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Clients */}
            {stats.topClients && stats.topClients.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">🌟 Clientes Recentes</h3>
                <div className="space-y-3">
                  {stats.topClients.slice(0, 5).map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleClientClick(client)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {(client.name || client.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {client.name || client.username}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {client.email}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        client.plan === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        client.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {client.plan?.toUpperCase() || 'FREE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">⚡ Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('invites')}
                  className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <span className="text-2xl">✉️</span>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">Convidar Cliente</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Enviar convite por email</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('clients')}
                  className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <span className="text-2xl">👥</span>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">Ver Clientes</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{clients.length} clientes cadastrados</p>
                  </div>
                </button>

                <Link
                  to="/marketplace"
                  className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <span className="text-2xl">🏪</span>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-white">Meu Perfil</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Editar perfil público</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Taxa de Crescimento</h4>
                  <span className="text-2xl">📈</span>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  +{((stats.overview?.totalClients || 0) * 12.5).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Últimos 30 dias</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Ticket Médio</h4>
                  <span className="text-2xl">💵</span>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  R$ {((parseFloat(stats.overview?.totalRevenue || 0) / Math.max(stats.overview?.totalClients || 1, 1))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Por cliente/mês</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Taxa de Retenção</h4>
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {((stats.overview?.activeClients || 0) / Math.max(stats.overview?.totalClients || 1, 1) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Clientes ativos</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
              📋 Seus Clientes
              <span className="text-sm font-normal text-slate-500">
                ({clients.length} {clients.length === 1 ? 'cliente' : 'clientes'})
              </span>
            </h3>

            {clients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Você ainda não tem clientes vinculados.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Seus clientes podem vincular você pelo email ou você pode convidá-los.
                </p>
                <button
                  onClick={() => setActiveTab('invites')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Convidar Clientes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleClientClick(client)}
                    className="p-5 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-purple-400"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {(client.name || client.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {client.name || client.username}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-600">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        client.plan === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        client.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {client.plan?.toUpperCase() || 'FREE'}
                      </span>
                      <button className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline">
                        Ver Detalhes →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">✉️ Convidar Clientes</h3>
            
            <div className="max-w-2xl">
              {/* Info Banner sobre Consentimento */}
              <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Sistema de Consentimento Implementado
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                      Seus clientes agora receberão um <strong>termo de consentimento claro e transparente</strong> antes de 
                      vincular sua conta. Isso garante conformidade com a LGPD e aumenta a confiança no seu serviço! 🔒
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Envie um convite para que seus clientes possam vinculá-lo como contador no sistema.
              </p>

              <form onSubmit={handleInviteClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email do Cliente
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="cliente@exemplo.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Enviar Convite
                </button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Como funciona?</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• O cliente receberá um email com instruções</li>
                  <li>• Ele poderá aceitar o convite pela plataforma</li>
                  <li>• Você terá acesso aos relatórios dele (somente leitura)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">⚙️ Configurações do Perfil</h3>
            
            <div className="space-y-6">
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4">Informações do Contador</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Nome:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{user?.name || user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Email:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Plano:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{user?.plan?.toUpperCase() || 'FREE'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/marketplace"
                  className="block w-full p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏪</span>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Editar Perfil Público</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Gerencie suas informações no marketplace</p>
                      </div>
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className="block w-full p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚙️</span>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Configurações da Conta</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Senha, dados fiscais, certificado</p>
                      </div>
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                🔔 Notificações
                {unreadCount > 0 && (
                  <span className="text-sm font-normal text-purple-600">
                    ({unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'})
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  ✓ Marcar todas como lidas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="text-4xl mb-4">📭</p>
                <p>Nenhuma notificação no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${
                      notif.read
                        ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                        : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {notif.title}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(notif.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-purple-600 dark:text-purple-400 hover:underline text-sm whitespace-nowrap"
                          >
                            ✓ Marcar lida
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-red-600 dark:text-red-400 hover:underline text-sm whitespace-nowrap"
                          title="Deletar notificação"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">📁 Documentos Compartilhados</h3>

            {/* Upload de Documento */}
            <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    📤 Enviar Documento
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    PDF, Word, Excel, imagens (máx. 10MB)
                  </p>
                </div>
                {selectedClient && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enviar para:</p>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {selectedClient.name}
                    </p>
                  </div>
                )}
              </div>

              {selectedClient ? (
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="documentFileInput"
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-all text-center ${
                      uploadingDocument
                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2 text-sm">
                      {uploadingDocument ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          📎 Selecionar arquivo
                        </>
                      )}
                    </span>
                  </label>
                  <input
                    id="documentFileInput"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        uploadDocument(e.target.files[0], selectedClient.id);
                        e.target.value = '';
                      }
                    }}
                    disabled={uploadingDocument}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  />
                </div>
              ) : (
                <div className="text-center py-4 px-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
                    ⚠️ Nenhum cliente selecionado
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Vá para a aba "Clientes" e selecione um cliente primeiro
                  </p>
                </div>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="text-4xl mb-4">📄</p>
                <p>Nenhum documento compartilhado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">📄</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {doc.originalName || doc.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Cliente: {doc.client?.name || doc.clientName || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => downloadDocument(doc.id, doc.originalName || doc.name)}
                        disabled={downloadingDoc === doc.id || deletingDoc === doc.id}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          downloadingDoc === doc.id
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-wait'
                            : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                        }`}
                      >
                        {downloadingDoc === doc.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            ...
                          </span>
                        ) : (
                          '📥 Baixar'
                        )}
                      </button>
                      <button
                        onClick={() => confirmDeleteDocument(doc.id, doc.originalName || doc.name)}
                        disabled={deletingDoc === doc.id || downloadingDoc === doc.id}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          deletingDoc === doc.id
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-wait'
                            : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                        }`}
                      >
                        {deletingDoc === doc.id ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Client Detail Tab */}
        {activeTab === 'client-detail' && selectedClient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <button
              onClick={() => setActiveTab('clients')}
              className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-2 mb-4"
            >
              ← Voltar para Clientes
            </button>

            {/* Client Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                    {(selectedClient.name || selectedClient.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedClient.name || selectedClient.username}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">{selectedClient.email}</p>
                    {clientReport?.client?.cpfCnpj && (
                      <p className="text-sm text-slate-500 mt-1">CPF/CNPJ: {clientReport.client.cpfCnpj}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedClient.plan === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                    selectedClient.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {selectedClient.plan?.toUpperCase() || 'FREE'}
                  </span>
                  <button
                    onClick={exportClientReport}
                    disabled={!clientReport}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            {loadingClientReport ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Carregando relatório do cliente...</p>
              </div>
            ) : clientReport ? (
              <>
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-green-500">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Receitas (12m)</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {parseFloat(clientReport.financials?.incomeBySource?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-red-500">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Despesas (12m)</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      R$ {parseFloat(clientReport.financials?.expensesByCategory?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      R$ {(parseFloat(clientReport.financials?.incomeBySource?.total || 0) - parseFloat(clientReport.financials?.expensesByCategory?.total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Charts */}
                {clientReport.monthlyTrend && clientReport.monthlyTrend.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">📈 Evolução Mensal</h3>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: clientReport.monthlyTrend.map(m => m.month),
                          datasets: [
                            {
                              label: 'Receitas',
                              data: clientReport.monthlyTrend.map(m => m.income),
                              borderColor: 'rgb(34, 197, 94)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: 'Despesas',
                              data: clientReport.monthlyTrend.map(m => m.expenses),
                              borderColor: 'rgb(239, 68, 68)',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              tension: 0.4
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Transactions Table */}
                {clientReport.transactions && clientReport.transactions.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">💼 Transações Recentes</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Data</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Descrição</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Categoria</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Tipo</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientReport.transactions.slice(0, 20).map((transaction, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-900 dark:text-white">
                                {transaction.description || 'Sem descrição'}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {transaction.category || '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  transaction.type === 'income'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                                </span>
                              </td>
                              <td className={`py-3 px-4 text-sm font-semibold text-right ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                R$ {parseFloat(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {clientReport.transactions.length > 20 && (
                      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                        Exibindo 20 de {clientReport.transactions.length} transações
                      </p>
                    )}
                  </div>
                )}

                {/* Categories Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {clientReport.financials?.incomeBySource && Object.keys(clientReport.financials.incomeBySource.sources || {}).length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">💰 Receitas por Fonte</h3>
                      <div className="space-y-3">
                        {Object.entries(clientReport.financials.incomeBySource.sources).map(([source, amount]) => (
                          <div key={source} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{source}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {clientReport.financials?.expensesByCategory && Object.keys(clientReport.financials.expensesByCategory.categories || {}).length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">📊 Despesas por Categoria</h3>
                      <div className="space-y-3">
                        {Object.entries(clientReport.financials.expensesByCategory.categories).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{category}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                <p className="text-4xl mb-4">📊</p>
                <p className="text-slate-600 dark:text-slate-400">Erro ao carregar relatório do cliente.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
      </div>
    </>
  );
};

export default AccountantDashboard;
