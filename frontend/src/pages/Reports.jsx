import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';
import FinancialPlanningModal from '../components/FinancialPlanningModal';

// Função helper para normalizar caracteres especiais para PDF
const normalizeForPDF = (text) => {
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

// Função para formatar valores em Real brasileiro
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  console.log('🚀🚀🚀 VERSÃO 2.4.5 - PERFEITO: LOGO + LAYOUT ENDEREÇO CORRIGIDO - 24/01/2026 12:35 🚀🚀🚀');
  
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // 🎯 Dados do usuário logado (com logo do Settings)
  const [accountantProfile, setAccountantProfile] = useState(null);

  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // User Plan Check
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPro = ['pro', 'premium', 'agency'].includes(user.plan);
  const isPremium = ['premium', 'agency'].includes(user.plan);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar transações
        const transactionsResponse = await api.get('/transactions');
        setTransactions(transactionsResponse.data);

        // Buscar dados do usuário atual (com logo do Settings!)
        const currentUserResponse = await api.get('/auth/me');
        const fetchedUser = currentUserResponse.data;
        setCurrentUser(fetchedUser); // 🎯 SALVAR NO ESTADO!
        console.log('👤 [REPORTS-INIT] Usuário atual:', fetchedUser.email, 'isAccountant:', fetchedUser.isAccountant);
        console.log('🖼️ [REPORTS-INIT] Logo do USUÁRIO (Settings):', fetchedUser.logo);
        console.log('🏢 [REPORTS-INIT] Nome do USUÁRIO:', fetchedUser.name);

        // Buscar contador vinculado (se houver) - OPCIONAL, só para fallback
        if (fetchedUser.isAccountant) {
          console.log('🔍 [REPORTS-INIT] Usuário é contador! Buscando próprio perfil...');
          try {
            const response = await api.get('/accountants/dashboard/stats');
            setAccountantProfile(response.data.accountantProfile);
            console.log('✅ [REPORTS-INIT] Perfil do contador salvo no estado:', response.data.accountantProfile?.businessName);
            console.log('🖼️ [REPORTS-INIT] Logo do PERFIL CONTADOR:', response.data.accountantProfile?.logo);
          } catch (error) {
            console.warn('⚠️ [REPORTS-INIT] Erro ao buscar perfil do contador:', error);
          }
        } else {
          // Se é cliente, buscar contador vinculado
          console.log('🔍 [REPORTS-INIT] Usuário é cliente! Buscando contador vinculado...');
          try {
            const response = await api.get('/accountants/my-accountant');
            setAccountantProfile(response.data);
            console.log('✅ [REPORTS-INIT] Perfil do contador vinculado salvo:', response.data?.businessName);
            console.log('🖼️ [REPORTS-INIT] Logo do contador vinculado:', response.data?.logo);
          } catch (error) {
            console.warn('⚠️ [REPORTS-INIT] Cliente sem contador vinculado:', error);
            setAccountantProfile(null);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data for charts
  const { incomeData, expenseData, monthlyData, summary, filteredTransactions } = useMemo(() => {
    const incomeMap = {};
    const expenseMap = {};
    const monthlyMap = {};
    const filteredList = [];
    
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.amount);
      
      // Safe Date Parsing
      let date;
      if (typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
          const [year, month, day] = t.date.split('-').map(Number);
          date = new Date(year, month - 1, day);
      } else {
          date = new Date(t.date);
      }

      const tMonth = date.getMonth();
      const tYear = date.getFullYear();
      const monthYearKey = date.toLocaleString(i18n.language, { month: 'short', year: 'numeric' });

      // Monthly totals (Filter by Selected Year for the trend chart)
      if (tYear === parseInt(selectedYear)) {
        if (!monthlyMap[monthYearKey]) monthlyMap[monthYearKey] = { income: 0, expense: 0 };
        if (t.type === 'income') {
            monthlyMap[monthYearKey].income += amount;
        } else {
            monthlyMap[monthYearKey].expense += Math.abs(amount);
        }
      }

      // Filter for specific breakdown charts and summary
      const isMonthMatch = selectedMonth === 'all' || tMonth === parseInt(selectedMonth);
      const isYearMatch = tYear === parseInt(selectedYear);

      if (isYearMatch && isMonthMatch) {
          filteredList.push(t);
          // Summary Totals
          if (t.type === 'income') totalIncome += amount;
          else totalExpense += Math.abs(amount);

          // Source/Category totals
          const source = t.source || 'Uncategorized';
          if (t.type === 'income') {
            incomeMap[source] = (incomeMap[source] || 0) + amount;
          } else {
            expenseMap[source] = (expenseMap[source] || 0) + Math.abs(amount);
          }
      }
    });

    return {
      filteredTransactions: filteredList,
      summary: {
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense
      },
      incomeData: {
        labels: Object.keys(incomeMap),
        datasets: [{
          data: Object.values(incomeMap),
          backgroundColor: [
            '#a855f7', '#ec4899', '#8b5cf6', '#6366f1', '#3b82f6', '#14b8a6'
          ],
          borderColor: '#ffffff10',
          borderWidth: 1,
        }]
      },
      expenseData: {
        labels: Object.keys(expenseMap),
        datasets: [{
          data: Object.values(expenseMap),
          backgroundColor: [
             '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#64748b'
          ],
          borderColor: '#ffffff10',
          borderWidth: 1,
        }]
      },
      monthlyData: {
        labels: Object.keys(monthlyMap),
        datasets: [
          {
            label: t('reports.total_income'),
            data: Object.values(monthlyMap).map(d => d.income),
            backgroundColor: '#a855f7',
            borderRadius: 4,
          },
          {
            label: t('reports.total_expenses'),
            data: Object.values(monthlyMap).map(d => d.expense),
            backgroundColor: '#ef4444',
            borderRadius: 4,
          }
        ]
      }
    };
  }, [transactions, selectedMonth, selectedYear, i18n.language, t]);

  const exportPDF = async () => {
    if (!isPro) {
        showAlert(t('reports.feature_locked'), t('reports.pdf_locked_msg'), 'locked');
        return;
    }
    
    try {
      // Validar dados necessários
      console.log('📋 Iniciando geração de PDF...');
      console.log('📊 Resumo:', summary);
      console.log('📝 Transações filtradas:', filteredTransactions?.length || 0);
      console.log('📝 Primeiras 3 transações:', filteredTransactions?.slice(0, 3));
      
      if (!summary || typeof summary.income !== 'number' || typeof summary.expense !== 'number') {
        throw new Error('Dados de resumo financeiro inválidos');
      }
      
      if (!Array.isArray(filteredTransactions)) {
        throw new Error('Lista de transações inválida');
      }
      
      // Se não há transações, avisar mas continuar
      if (filteredTransactions.length === 0) {
        console.warn('⚠️ Nenhuma transação encontrada para o período selecionado');
      }
      
      // Buscar dados atualizados do usuário antes de gerar o PDF
      let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      try {
        const userResponse = await api.get('/auth/me');
        currentUser = userResponse.data;
        // Atualizar localStorage com dados completos
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.warn('Não foi possível buscar dados atualizados do usuário, usando dados do localStorage:', error);
        // Continua com dados do localStorage se a API falhar
      }
      
      // 🎯 USAR accountantProfile que JÁ está no estado (carregado no useEffect)
      console.log('📦 [PDF-EXPORT] Usando accountantProfile do estado:', accountantProfile?.businessName);
      console.log('🖼️ [PDF-EXPORT] Logo disponível:', accountantProfile?.logo);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      
      // 🎯 PREPARAR DADOS DA LOGO (mas não adicionar ainda!)
      let logoData = null; // Armazenar data URL da logo
      let logoSource = null; // Para debug
      let displayName = null; // Nome para o header
      
      console.log('🔍 [LOGO-DEBUG] currentUser:', currentUser);
      console.log('🔍 [LOGO-DEBUG] currentUser.logo:', currentUser?.logo);
      console.log('🔍 [LOGO-DEBUG] accountantProfile:', accountantProfile);
      console.log('🔍 [LOGO-DEBUG] accountantProfile.logo:', accountantProfile?.logo);
      
      // 1️⃣ PRIORIDADE: Logo do USUÁRIO (cadastrada no Settings)
      if (currentUser?.logo) {
        logoSource = currentUser.logo;
        displayName = currentUser.name || 'Usuario';
        console.log('🎯 [LOGO-PRIORITY] Usando logo do USUÁRIO (Settings):', logoSource);
        console.log('🎯 [LOGO-PRIORITY] Nome do USUÁRIO:', displayName);
      } 
      // 2️⃣ FALLBACK: Logo do perfil de contador
      else if (accountantProfile?.logo) {
        logoSource = accountantProfile.logo;
        displayName = accountantProfile.businessName || accountantProfile.name || 'Contador';
        console.log('🔄 [LOGO-FALLBACK] Usando logo do PERFIL CONTADOR:', logoSource);
        console.log('🔄 [LOGO-FALLBACK] Nome do CONTADOR:', displayName);
      }
      // 3️⃣ SEM LOGO: Vai usar inicial depois
      else {
        console.log('⚠️ [LOGO] Nenhuma logo encontrada - usará inicial');
        displayName = currentUser?.name || accountantProfile?.businessName || 'Lumini';
        console.log('⚠️ [LOGO] displayName final:', displayName);
      }
      
      // Se tem logo para carregar, PROCESSAR (mas NÃO adicionar ainda!)
      if (logoSource) {
        console.log('✅ [LOGO] Carregando logo:', logoSource);
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          // 🔧 CONSTRUIR URL COMPLETA CORRETA
          let logoUrl = logoSource;
          
          // Se já é URL completa, usar como está
          if (logoUrl.startsWith('http')) {
            console.log('🌐 [LOGO] Já é URL completa:', logoUrl);
          } else {
            // Se não tem o prefixo /uploads/logos/, adicionar
            if (!logoUrl.startsWith('/uploads/logos/')) {
              logoUrl = `/uploads/logos/${logoUrl}`;
              console.log('📁 [LOGO] Adicionado prefixo /uploads/logos/:', logoUrl);
            }
            
            // 🔥 FORÇAR DOMÍNIO CORRETO DO FLY.IO
            const baseUrl = 'https://lumini-i-a.fly.dev';
            logoUrl = `${baseUrl}${logoUrl}`;
            console.log('🌐 [LOGO] URL CORRIGIDA para Fly.io:', logoUrl);
          }
          
          logoData = await new Promise((resolve, reject) => {
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
                  const data = canvas.toDataURL('image/png', 1.0);
                  
                  if (data && data.length > 100) {
                    console.log('✅ [LOGO] Logo processada com sucesso! Tamanho:', data.length);
                    resolve(data); // RETORNAR data URL, NÃO adicionar ao PDF ainda!
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              } catch (e) {
                console.warn('Erro ao processar logo:', e);
                resolve(null);
              }
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve(null);
            };
            img.src = logoUrl;
          });
        } catch (e) {
          console.error('❌ [LOGO] Erro:', e);
          logoData = null;
        }
      }
      
      // ===== HEADER ULTRA MODERNO COM GRADIENTE SUAVE =====
      // Gradiente roxo para azul (3 camadas para efeito smooth)
      doc.setFillColor(109, 40, 217); // Purple 700
      doc.rect(0, 0, pageWidth, 55, 'F');
      doc.setFillColor(124, 58, 237); // Purple 600
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFillColor(139, 92, 246); // Purple 500
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Elementos decorativos (círculos)
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({opacity: 0.1}));
      doc.circle(pageWidth - 20, 15, 25, 'F');
      doc.circle(pageWidth - 40, 35, 15, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      // Title Section - Nome do USUÁRIO (Settings) ou Contador ou Lumini
      const headerTitle = displayName || 'Lumini I.A';
      console.log('📝 [PDF-HEADER] Título selecionado:', headerTitle);
      console.log('   - currentUser.name:', currentUser?.name);
      console.log('   - accountantProfile.businessName:', accountantProfile?.businessName);
      
      // Ajustar fonte dinamicamente baseado no tamanho do texto
      let fontSize = 28;
      const normalizedTitle = normalizeForPDF(headerTitle);
      if (normalizedTitle.length > 30) {
        fontSize = 20; // Título muito longo
      } else if (normalizedTitle.length > 25) {
        fontSize = 24; // Título médio
      }
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      
      // Quebrar texto se for muito longo (máximo 100mm de largura)
      const maxWidth = pageWidth - 60; // Deixar espaço para logo e margens
      const titleLines = doc.splitTextToSize(normalizedTitle, maxWidth);
      
      // Se tiver múltiplas linhas, ajustar posição vertical
      if (titleLines.length > 1) {
        doc.text(titleLines, 50, 20); // Começar um pouco mais acima
      } else {
        doc.text(normalizedTitle, 50, 22);
      }
      
      // Subtitle com ícone
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.setGState(doc.GState({opacity: 0.95}));
      doc.text(normalizeForPDF('Analise Financeira Profissional'), 50, 31);
      doc.setGState(doc.GState({opacity: 1}));
      
      // Data de geração no header
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setGState(doc.GState({opacity: 0.8}));
      const headerDate = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      doc.text(normalizeForPDF(`Gerado em ${headerDate}`), 50, 35);
      doc.setGState(doc.GState({opacity: 1}));
      
      // 🎯 ADICIONAR LOGO POR CIMA DO HEADER (depois de desenhar o fundo roxo!)
      console.log('🔍 [LOGO-FINAL] logoData existe?', !!logoData);
      console.log('🔍 [LOGO-FINAL] logoData length:', logoData?.length);
      console.log('🔍 [LOGO-FINAL] displayName:', displayName);
      
      if (logoData && logoData.length > 100) {
        try {
          console.log('📸 [LOGO-FINAL] Tentando adicionar logo ao PDF...');
          doc.addImage(logoData, 'PNG', 14, 8, 32, 32);
          console.log('✅ [LOGO] Logo HD adicionada ao PDF POR CIMA do header!');
        } catch (e) {
          console.error('❌ [LOGO] Erro ao adicionar logo ao PDF:', e);
          // Fallback: usar inicial
          const initial = normalizeForPDF(displayName || 'L').charAt(0).toUpperCase();
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(initial, 26, 29);
        }
      } else if (!logoData && displayName) {
        // Fallback: usar inicial se não tem logo
        console.log('📝 [LOGO-FALLBACK] Usando inicial:', displayName.charAt(0));
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const initial = normalizeForPDF(displayName).charAt(0).toUpperCase();
        doc.text(initial, 26, 29);
      } else {
        console.warn('⚠️ [LOGO-FALLBACK] Nenhuma logo nem displayName! Usando "L"');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('L', 26, 29);
      }
      
      // Linha decorativa com gradiente
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(2);
      doc.setGState(doc.GState({opacity: 0.3}));
      doc.line(14, 48, pageWidth - 14, 48);
      doc.setGState(doc.GState({opacity: 1}));
      
      yPosition = 62;
      
      // ===== USER INFO CARD (DESIGN ULTRA MODERNO) =====
      if (currentUser.name || currentUser.email) {
        // Sombra do card (simulada)
        doc.setFillColor(226, 232, 240);
        doc.setGState(doc.GState({opacity: 0.3}));
        doc.rect(15, yPosition - 4, pageWidth - 28, 38, 'F');
        doc.setGState(doc.GState({opacity: 1}));
        
        // Card background com gradiente sutil
        doc.setFillColor(255, 255, 255);
        doc.rect(14, yPosition - 5, pageWidth - 28, 38, 'F');
        
        // Borda superior colorida (accent)
        doc.setFillColor(139, 92, 246);
        doc.rect(14, yPosition - 5, pageWidth - 28, 3, 'F');
        
        // Card border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.rect(14, yPosition - 5, pageWidth - 28, 38);
        
        // Title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(normalizeForPDF('Dados do Cliente'), 30, yPosition + 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        
        let infoX = 30;
        let infoY = yPosition + 10;
        const infoWidth = (pageWidth - 50) / 2;
        
        // Linha 1: Nome e Email
        if (currentUser.name) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(normalizeForPDF(currentUser.name), infoX, infoY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
        }
        if (currentUser.email) {
          doc.text(`${currentUser.email}`, infoX + infoWidth, infoY);
        }
        
        // Linha 2: CPF/CNPJ (se existir)
        if (currentUser.cpfCnpj) {
          infoY += 6;
          doc.text(`CPF/CNPJ: ${currentUser.cpfCnpj}`, infoX, infoY);
        }
        
        // Linha 3: Endereço (sempre em nova linha)
        if (currentUser.address) {
          infoY += 6;
          // Não usar normalizeForPDF no endereço para preservar caracteres especiais
          const addressText = `Endereco: ${currentUser.address.substring(0, 50)}`;
          doc.text(addressText, infoX, infoY);
        }
        
        yPosition += 43;
      }
      
      // ===== PERIOD INFO (BADGE MODERNO) =====
      const periodText = selectedMonth === 'all' 
        ? `${t('reports.all_months')} ${selectedYear}`
        : `${new Date(selectedYear, parseInt(selectedMonth)).toLocaleString(i18n.language, { month: 'long', year: 'numeric' })}`;
      const generatedDate = new Date().toLocaleDateString(i18n.language);
      const generatedTime = new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
      
      // Period badge com sombra
      doc.setFillColor(200, 200, 200);
      doc.setGState(doc.GState({opacity: 0.2}));
      doc.rect(15, yPosition - 3, 85, 11, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      doc.setFillColor(139, 92, 246);
      doc.rect(14, yPosition - 4, 85, 11, 'F');
      
      // Badge de período (sem ícone)
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(normalizeForPDF(periodText), 24, yPosition + 2.5);
      
      // Status badge (Gerado)
      doc.setFillColor(16, 185, 129); // Green
      doc.rect(pageWidth - 90, yPosition - 4, 76, 11, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      const genText = `${generatedDate} ${generatedTime}`;
      doc.text(normalizeForPDF(genText), pageWidth - 82, yPosition + 2.5);
      
      yPosition += 20;
      
      // ===== FINANCIAL SUMMARY CARDS (DESIGN PREMIUM) =====
      // Section title
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(normalizeForPDF('Resumo Financeiro'), 14, yPosition);
      yPosition += 12;
      
      const cardWidth = (pageWidth - 40) / 3; // 3 cards
      const cardHeight = 38;
      const cardSpacing = 13;
      
      // Card 1: Receitas (Income) - Design Moderno
      const card1X = 14;
      // Sombra
      doc.setFillColor(200, 200, 200);
      doc.setGState(doc.GState({opacity: 0.15}));
      doc.rect(card1X + 1, yPosition + 1, cardWidth, cardHeight, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      // Background com gradiente verde
      doc.setFillColor(240, 253, 244); // Green 50
      doc.rect(card1X, yPosition, cardWidth, cardHeight, 'F');
      
      // Borda esquerda colorida
      doc.setFillColor(16, 185, 129);
      doc.rect(card1X, yPosition, 3, cardHeight, 'F');
      
      // Ícone
      doc.setFillColor(16, 185, 129);
      doc.setGState(doc.GState({opacity: 0.2}));
      doc.circle(card1X + 10, yPosition + 10, 5, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text('↑', card1X + 8, yPosition + 12);
      
      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(normalizeForPDF(t('reports.total_income') || 'RECEITAS'), card1X + 18, yPosition + 10);
      
      // Valor
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      const incomeText = formatCurrency(summary.income || 0);
      doc.text(normalizeForPDF(incomeText), card1X + 8, yPosition + 26);
      
      // Card 2: Despesas (Expenses)
      const card2X = card1X + cardWidth + cardSpacing;
      // Sombra
      doc.setFillColor(200, 200, 200);
      doc.setGState(doc.GState({opacity: 0.15}));
      doc.rect(card2X + 1, yPosition + 1, cardWidth, cardHeight, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      // Background
      doc.setFillColor(254, 242, 242); // Red 50
      doc.rect(card2X, yPosition, cardWidth, cardHeight, 'F');
      
      // Borda esquerda
      doc.setFillColor(239, 68, 68);
      doc.rect(card2X, yPosition, 3, cardHeight, 'F');
      
      // Ícone
      doc.setFillColor(239, 68, 68);
      doc.setGState(doc.GState({opacity: 0.2}));
      doc.circle(card2X + 10, yPosition + 10, 5, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text('↓', card2X + 8, yPosition + 12);
      
      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(normalizeForPDF(t('reports.total_expenses') || 'DESPESAS'), card2X + 18, yPosition + 10);
      
      // Valor
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      const expenseText = formatCurrency(summary.expense || 0);
      doc.text(normalizeForPDF(expenseText), card2X + 8, yPosition + 26);
      
      // Card 3: Saldo (Balance)
      const card3X = card2X + cardWidth + cardSpacing;
      const balanceColor = (summary.balance || 0) >= 0 ? [139, 92, 246] : [239, 68, 68];
      const balanceBg = (summary.balance || 0) >= 0 ? [245, 243, 255] : [254, 242, 242];
      
      // Sombra
      doc.setFillColor(200, 200, 200);
      doc.setGState(doc.GState({opacity: 0.15}));
      doc.rect(card3X + 1, yPosition + 1, cardWidth, cardHeight, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      
      // Background
      doc.setFillColor(...balanceBg);
      doc.rect(card3X, yPosition, cardWidth, cardHeight, 'F');
      
      // Borda esquerda
      doc.setFillColor(...balanceColor);
      doc.rect(card3X, yPosition, 3, cardHeight, 'F');
      
      // Ícone
      doc.setFillColor(...balanceColor);
      doc.setGState(doc.GState({opacity: 0.2}));
      doc.circle(card3X + 10, yPosition + 10, 5, 'F');
      doc.setGState(doc.GState({opacity: 1}));
      doc.setFontSize(10);
      doc.setTextColor(...balanceColor);
      doc.text('=', card3X + 8, yPosition + 12);
      
      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.text(normalizeForPDF(t('reports.net_balance') || 'SALDO'), card3X + 18, yPosition + 10);
      
      // Valor
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...balanceColor);
      const balanceText = formatCurrency(summary.balance || 0);
      doc.text(normalizeForPDF(balanceText), card3X + 8, yPosition + 26);
      
      yPosition += cardHeight + 16;
      
      // ===== TRANSACTIONS SECTION (DESIGN PREMIUM) =====
      if (filteredTransactions && filteredTransactions.length > 0) {
        try {
          // Section title com gradiente
          doc.setFillColor(99, 102, 241); // Indigo 500
          doc.rect(14, yPosition - 6, pageWidth - 28, 12, 'F');
          doc.setFillColor(139, 92, 246); // Purple 500  
          doc.rect(14, yPosition - 6, (pageWidth - 28) * 0.7, 12, 'F');
          
          // Título
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(normalizeForPDF(t('transactions.title') || 'Detalhamento de Transacoes'), 18, yPosition);
          
          // Contador de transações
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setGState(doc.GState({opacity: 0.9}));
          doc.text(`${filteredTransactions.length} registros`, pageWidth - 40, yPosition);
          doc.setGState(doc.GState({opacity: 1}));
          
          yPosition += 11;
          
          // Format table data com validação MELHORADA
          console.log('📊 Processando transações para PDF:', filteredTransactions.length);
          const tableData = filteredTransactions.map((t, index) => {
            try {
              // Data
              let date = '-';
              if (t.date) {
                try {
                  const dateObj = new Date(t.date);
                  if (!isNaN(dateObj.getTime())) {
                    date = dateObj.toLocaleDateString(i18n.language || 'pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                  } else {
                    date = String(t.date).substring(0, 10);
                  }
                } catch (e) {
                  date = String(t.date || '-').substring(0, 10);
                }
              }
              
              // Descrição
              let description = String(t.description || t.name || '-');
              if (!description || description === '-') {
                description = t.type === 'income' ? 'Receita' : 'Despesa';
              }
              description = normalizeForPDF(description.substring(0, 50));
              
              // Fonte/Categoria
              const uncategorizedLabel = 'Sem Categoria';
              let source = String(t.source || t.category || uncategorizedLabel);
              source = normalizeForPDF(source.substring(0, 30));
              
              // Valor
              let amountValue = 0;
              if (t.amount !== undefined && t.amount !== null) {
                try {
                  amountValue = parseFloat(t.amount);
                  if (isNaN(amountValue)) {
                    amountValue = 0;
                  }
                } catch (e) {
                  console.warn(`Erro ao parsear valor da transação ${index}:`, e);
                  amountValue = 0;
                }
              }
              
              const formattedAmount = formatCurrency(Math.abs(amountValue));
              const amount = (t.type === 'income') 
                ? `+ ${normalizeForPDF(formattedAmount)}` 
                : `- ${normalizeForPDF(formattedAmount)}`;
              
              // Log para debug
              if (index < 3) {
                console.log(`Transação ${index}:`, { date, description, source, amount });
              }
              
              return [date, description, source, amount];
            } catch (rowError) {
              console.error(`Erro ao processar linha ${index} da tabela:`, rowError, t);
              return ['-', '-', '-', '-'];
            }
          });
          
          console.log('✅ Dados da tabela processados:', tableData.length, 'linhas');
          
          if (tableData.length > 0) {
    autoTable(doc, {
                startY: yPosition,
                head: [[
                    normalizeForPDF(t('common.date') || 'Data'), 
                    normalizeForPDF(t('common.description') || 'Descricao'), 
                    normalizeForPDF('Fonte/Categoria'), 
                    normalizeForPDF('Valor')
                ]], 
        body: tableData,
        theme: 'striped',
                headStyles: { 
                    fillColor: [71, 85, 105], // Slate 600
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10,
                    halign: 'left',
                    valign: 'middle'
                },
                bodyStyles: { 
                    fontSize: 9,
                    textColor: [30, 41, 59], // Slate 800
                    lineColor: [226, 232, 240], // Slate 200
                    lineWidth: 0.1
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252] // Slate 50
                },
                columnStyles: {
                    0: { cellWidth: 30, halign: 'left' },
                    1: { cellWidth: 75, halign: 'left' },
                    2: { cellWidth: 50, halign: 'left' },
                    3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
                },
                margin: { left: 14, right: 14, top: 5 },
                styles: { 
                    overflow: 'linebreak',
                    cellPadding: 4,
                    lineColor: [226, 232, 240],
                    lineWidth: 0.1
                },
                tableLineColor: [226, 232, 240],
                tableLineWidth: 0.1
            });
          }
        } catch (transactionsError) {
          console.error('Erro ao criar tabela de transações:', transactionsError);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(148, 163, 184);
          doc.text(normalizeForPDF('Erro ao processar transacoes.'), 14, yPosition);
          yPosition += 10;
        }
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(normalizeForPDF('Nenhuma transacao encontrada para o periodo selecionado.'), 14, yPosition);
        yPosition += 10;
      }
      
      // ===== FOOTER ULTRA ELEGANTE =====
      try {
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          
          // Footer com gradiente
          doc.setFillColor(248, 250, 252); // Slate 50
          doc.rect(0, pageHeight - 28, pageWidth, 28, 'F');
          
          // Linha superior gradiente (2 cores)
          doc.setFillColor(139, 92, 246); // Purple
          doc.rect(0, pageHeight - 28, pageWidth / 2, 2, 'F');
          doc.setFillColor(99, 102, 241); // Indigo
          doc.rect(pageWidth / 2, pageHeight - 28, pageWidth / 2, 2, 'F');
          
          // Elementos decorativos (pequenos círculos)
          doc.setFillColor(139, 92, 246);
          doc.setGState(doc.GState({opacity: 0.1}));
          doc.circle(30, pageHeight - 14, 8, 'F');
          doc.circle(pageWidth - 30, pageHeight - 14, 8, 'F');
          doc.setGState(doc.GState({opacity: 1}));
          
          // Texto principal - Nome do USUÁRIO ou Contador ou Lumini
          const footerTitle = displayName || 'Lumini I.A';
          const footerSubtitle = (currentUser?.logo || accountantProfile) ? 'Contabilidade Profissional' : 'Gestao Financeira Inteligente';
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(139, 92, 246);
          doc.text(
            normalizeForPDF(footerTitle),
            14,
            pageHeight - 16
          );
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text(
            normalizeForPDF(footerSubtitle),
            14,
            pageHeight - 11
          );
          
          // Paginação (centro) com estilo
          doc.setFillColor(139, 92, 246);
          doc.setGState(doc.GState({opacity: 0.1}));
          doc.rect(pageWidth / 2 - 15, pageHeight - 19, 30, 8, 'F');
          doc.setGState(doc.GState({opacity: 1}));
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(139, 92, 246);
          doc.text(
            `${i} / ${totalPages}`,
            pageWidth / 2,
            pageHeight - 14,
            { align: 'center' }
          );
          
          // Data e website (direita)
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          const footerDate = new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
          doc.text(
            footerDate,
            pageWidth - 14,
            pageHeight - 16,
            { align: 'right' }
          );
          
          // Website
          doc.setFontSize(6);
          doc.setTextColor(139, 92, 246);
          doc.text(
            'luminiiadigital.com.br',
            pageWidth - 14,
            pageHeight - 11,
            { align: 'right' }
          );
        }
      } catch (footerError) {
        console.warn('Erro ao adicionar footer:', footerError);
      }
      
      // Save PDF
      try {
        const fileName = `lumini-relatorio-${selectedYear}-${selectedMonth === 'all' ? 'todos' : String(parseInt(selectedMonth) + 1).padStart(2, '0')}.pdf`;
        doc.save(fileName);
      } catch (saveError) {
        console.error('Erro ao salvar PDF:', saveError);
        throw new Error('Erro ao salvar arquivo PDF');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao gerar o relatório PDF';
      showAlert(t('common.error') || 'Erro', `Erro ao gerar o relatorio PDF: ${errorMessage}. Tente novamente.`, 'error');
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e5e7eb' }
      },
      title: { display: false }
    },
    scales: {
      y: {
        grid: { color: '#ffffff10' },
        ticks: { color: '#9ca3af' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e5e7eb', boxWidth: 12 }
      }
    },
    cutout: '70%',
    borderWidth: 0
  };

  const exportCSV = () => {
    if (!isPro) {
        showAlert(t('reports.feature_locked'), t('reports.csv_locked_msg'), 'locked');
        return;
    }
    // CSV Header
    const headers = [`${t('common.date')},${t('common.description')},${t('reports.type')},${t('reports.source')},${t('plans.amount')},${t('reports.goal')}`];
    
    // CSV Rows
    const rows = filteredTransactions.map(t => {
        const date = new Date(t.date).toLocaleDateString(i18n.language);
        const amount = t.type === 'expense' ? -Math.abs(t.amount) : t.amount;
        // Escape commas in description to prevent CSV breakage
        const safeDesc = `"${t.description.replace(/"/g, '""')}"`; 
        const safeSource = t.source || t('common.uncategorized') || 'Uncategorized';
        const safeGoal = t.Goal ? t.Goal.name : '';
        
        return `${date},${safeDesc},${t.type},${safeSource},${amount},${safeGoal}`;
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `lumini_report_${selectedYear}_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <FinancialPlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        transactions={transactions}
      />
      <div className="flex flex-col gap-4 px-2 sm:px-0">
        <div>
            <h1 className="text-2xl sm:text-3xl ipad-air:text-4xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{t('reports.title')}</h1>
            <p className="text-sm sm:text-base ipad-air:text-lg text-slate-500 dark:text-gray-400">{t('reports.subtitle')}</p>
        </div>
        
        {/* Filtros de Mês/Ano */}
        <div className="flex flex-col sm:flex-row gap-2">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
            >
                <option value="all">{t('reports.all_months')}</option>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                        {new Date(0, i).toLocaleString(i18n.language, { month: 'long' })}
                    </option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
            >
                {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                })}
            </select>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <button 
                onClick={() => {
                    if (isPremium) {
                        setIsPlanningModalOpen(true);
                    } else {
                        showAlert(t('reports.feature_locked'), t('reports.planning_locked_msg'), 'locked');
                    }
                }}
                className={`w-full px-3 sm:px-4 ipad-air:px-5 py-2 ipad-air:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ipad-air:text-lg ${isPremium ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <span>📈</span> <span className="truncate">{t('reports.planning_btn')} {!isPremium && '🔒'}</span>
            </button>
            <button 
                onClick={exportCSV}
                className={`w-full px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${isPro ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <span>📊</span> <span className="truncate">{t('reports.export_csv')} {!isPro && '🔒'}</span>
            </button>
            <button 
                onClick={exportPDF}
                className={`w-full px-3 sm:px-4 ipad-air:px-5 py-2 ipad-air:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ipad-air:text-lg ${isPro ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <span>📄</span> <span className="truncate">{t('reports.export_pdf')} {!isPro && '🔒'}</span>
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ipad-air:grid-cols-3 gap-4 md:gap-5 ipad-air:gap-6 px-2 sm:px-0">
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 ipad-air:p-7 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl transition-colors">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm ipad-air:text-base font-medium mb-1">{t('reports.total_income')}</h3>
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 break-all">R$ {summary.income.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl transition-colors">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">{t('reports.total_expenses')}</h3>
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 break-all">R$ {summary.expense.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl transition-colors sm:col-span-2 md:col-span-1">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-1">{t('reports.net_balance')}</h3>
            <p className={`text-xl sm:text-2xl font-bold break-all ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                R$ {summary.balance.toFixed(2)}
            </p>
        </div>
      </div>
      
      {/* Monthly Overview */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors mx-2 sm:mx-0">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 transition-colors">{t('reports.monthly_overview')}</h2>
        <div className="h-48 sm:h-64 relative">
          <Bar options={chartOptions} data={monthlyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2 sm:px-0">
        {/* Income Breakdown */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 transition-colors">{t('reports.income_sources')}</h2>
          <div className="h-48 sm:h-64 flex justify-center relative">
             {incomeData.labels.length > 0 ? (
                <Doughnut options={doughnutOptions} data={incomeData} />
             ) : (
                <p className="text-slate-400 dark:text-gray-400 self-center">{t('reports.no_income_data')}</p>
             )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 transition-colors">{t('reports.expense_breakdown')}</h2>
          <div className="h-48 sm:h-64 flex justify-center relative">
            {expenseData.labels.length > 0 ? (
                <Doughnut options={doughnutOptions} data={expenseData} />
             ) : (
                <p className="text-slate-400 dark:text-gray-400 self-center">{t('reports.no_expense_data')}</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
