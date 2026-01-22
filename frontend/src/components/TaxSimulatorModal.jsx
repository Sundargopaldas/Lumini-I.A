import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CustomAlert from './CustomAlert';

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

const TaxSimulatorModal = ({ isOpen, onClose }) => {
  const [revenue, setRevenue] = useState({ service: 0, commerce: 0 });
  const [irpfData, setIrpfData] = useState({ grossIncome: 0, dependents: 0, otherDeductions: 0 });
  
  // Advanced Mode State
  const [mode, setMode] = useState('mei'); // 'mei', 'simples', 'irpf'
  const [anexo, setAnexo] = useState('III'); // 'III' or 'V' for Simples Nacional

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

  // Preload Logo for PDF
  const [logoBase64, setLogoBase64] = useState(null);

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const img = new Image();
        img.src = '/logo.svg';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 200; 
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 200, 200);
          try {
            const dataUrl = canvas.toDataURL('image/png');
            setLogoBase64(dataUrl);
          } catch (e) {
            console.warn('Could not convert logo to base64', e);
          }
        };
      } catch (error) {
        console.error('Error loading logo for PDF:', error);
      }
    };
    loadImage();
  }, []);

  if (!isOpen) return null;

  // 2025/2026 MEI Values (Estimated)
  const INSS_MEI = 75.10;
  const ICMS = 1.00;
  const ISS = 5.00;

  // Helper to parse BRL currency (e.g. "1.000,00" -> 1000.00)
  const parseMoney = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove non-numeric/dot/comma
    const cleanStr = value.toString().replace(/[^0-9.,]/g, '');
    // If it has a comma, treat as BRL (dot=thousand, comma=decimal)
    if (cleanStr.includes(',')) {
        return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.')) || 0;
    }
    // If no comma, but has dots:
    // "1.000" -> 1000 (Treat dot as thousand separator preference in BRL context)
    // But "1.5" -> 1.5 (Standard JS)
    // To solve "4.500" issue, let's assume if it looks like thousands (3 digits after dot), it's thousands.
    // But simplest is: just treat dot as thousand separator if we are strictly BRL.
    // However, let's stick to a hybrid safe approach:
    // If user types "1000.50", we want 1000.50.
    // If user types "1.000", we want 1000.
    // Let's rely on the user using comma for decimal as hinted by placeholder.
    // Fallback to standard parseFloat if no comma.
    return parseFloat(cleanStr) || 0;
  };

  // IRPF Calculation Helper
  const calculateIRPF = () => {
    const gross = parseMoney(irpfData.grossIncome);
    
    // 1. Calculate INSS (2024 Progressive Table)
    let inss = 0;
    if (gross <= 1412.00) inss = gross * 0.075;
    else if (gross <= 2666.68) inss = (1412 * 0.075) + ((gross - 1412) * 0.09);
    else if (gross <= 4000.03) inss = (1412 * 0.075) + ((2666.68 - 1412) * 0.09) + ((gross - 2666.68) * 0.12);
    else if (gross <= 7786.02) inss = (1412 * 0.075) + ((2666.68 - 1412) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((gross - 4000.03) * 0.14);
    else inss = (1412 * 0.075) + ((2666.68 - 1412) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((7786.02 - 4000.03) * 0.14); // Teto

    // 2. Calculate Base Calculation
    const deductionDependents = (parseInt(irpfData.dependents) || 0) * 189.59;
    const baseCalc = gross - inss - deductionDependents - parseMoney(irpfData.otherDeductions);


    // 3. Apply IRPF Table (2024/2025)
    let irpf = 0;
    if (baseCalc <= 2259.20) {
        irpf = 0;
    } else if (baseCalc <= 2826.65) {
        irpf = (baseCalc * 0.075) - 169.44;
    } else if (baseCalc <= 3751.05) {
        irpf = (baseCalc * 0.15) - 381.44;
    } else if (baseCalc <= 4664.68) {
        irpf = (baseCalc * 0.225) - 662.77;
    } else {
        irpf = (baseCalc * 0.275) - 896.00;
    }

    return {
        inss: inss,
        baseCalc: Math.max(0, baseCalc),
        irpf: Math.max(0, irpf),
        netIncome: gross - inss - Math.max(0, irpf)
    };
  };

  const calculateDAS = () => {
    if (mode === 'mei') {
        let total = INSS_MEI;
        if (parseMoney(revenue.commerce) > 0) total += ICMS;
        if (parseMoney(revenue.service) > 0) total += ISS;
        return total;
    } else if (mode === 'simples') {
        // Simples Nacional Logic (Simplified)
        const totalRev = parseMoney(revenue.service) + parseMoney(revenue.commerce);
        const rate = anexo === 'III' ? 0.06 : 0.155;
        return totalRev * rate;
    } else {
        return 0; // Handled by calculateIRPF
    }
  };

  const totalRevenue = parseMoney(revenue.service) + parseMoney(revenue.commerce);
  const annualProjection = totalRevenue * 12;
  const meiLimit = 81000;
  const simplesLimit = 4800000;
  
  const isOverLimit = mode === 'mei' ? annualProjection > meiLimit : annualProjection > simplesLimit;

  // REMOVED: Moved hooks (logoBase64 state and effect) to top of component to avoid "Rendered more hooks" error


  const generatePDF = () => {
    const doc = new jsPDF();
    const companyName = user.name || 'Nome da Empresa Não Informado';
    const documentId = user.cpfCnpj || 'CPF/CNPJ Não Informado';

    // Header with Logo
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 10, 15, 15);
        doc.setFontSize(22);
        doc.setTextColor(112, 26, 117); // Purple
        doc.text('Lumini I.A', 32, 20);
    } else {
        doc.setFontSize(22);
        doc.setTextColor(112, 26, 117); // Purple
        doc.text('Lumini I.A', 14, 20);
    }
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(normalizeForPDF(mode === 'irpf' ? 'Simulacao de Imposto de Renda (IRPF)' : 'Relatorio de Simulacao Fiscal'), 14, 30);

    // Company Info
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(normalizeForPDF(`Empresa/Usuario: ${companyName}`), 14, 38);
    doc.text(`CPF/CNPJ: ${documentId}`, 14, 43);
    doc.text(normalizeForPDF(`Gerado em: ${new Date().toLocaleDateString()} as ${new Date().toLocaleTimeString()}`), 14, 48);

    if (mode === 'irpf') {
        const result = calculateIRPF();
        
        // Input Data
        autoTable(doc, {
            startY: 55,
            head: [['Parâmetro', 'Valor']],
            body: [
                ['Renda Bruta Mensal', `R$ ${parseMoney(irpfData.grossIncome).toFixed(2)}`],
                ['Dependentes', irpfData.dependents],
                ['Outras Deduções', `R$ ${parseMoney(irpfData.otherDeductions).toFixed(2)}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [112, 26, 117] },
        });

        // Results
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Detalhamento', 'Valor']],
            body: [
                ['Desconto INSS (Estimado)', `R$ ${result.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Base de Cálculo', `R$ ${result.baseCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Imposto de Renda (IRPF)', `R$ ${result.irpf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Salário Líquido', `R$ ${result.netIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Alíquota Efetiva', `${((result.irpf / (parseMoney(irpfData.grossIncome) || 1)) * 100).toFixed(2)}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
        });
    } else {
        // MEI/Simples Logic
        autoTable(doc, {
            startY: 55,
            head: [['Parâmetro', 'Valor']],
            body: [
                ['Regime Tributário', mode === 'mei' ? 'MEI (Microempreendedor Individual)' : 'Simples Nacional'],
                ['Anexo (Se Simples)', mode === 'simples' ? (anexo === 'III' ? 'Anexo III (Serviços Gerais)' : 'Anexo V (Intelectual)') : 'N/A'],
                ['Faturamento Mensal (Serviço)', `R$ ${parseMoney(revenue.service).toFixed(2)}`],
                ['Faturamento Mensal (Comércio)', `R$ ${parseMoney(revenue.commerce).toFixed(2)}`],
                ['Projeção Anual', `R$ ${annualProjection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [112, 26, 117] },
        });

        const monthlyTax = calculateDAS();
        const annualTax = monthlyTax * 12;

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Resultado Estimado', 'Valor']],
            body: [
                ['Imposto Mensal (Estimado)', `R$ ${monthlyTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Custo Anual de Impostos', `R$ ${annualTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Status do Limite Anual', isOverLimit ? '⚠️ ACIMA DO LIMITE' : '✅ DENTRO DO LIMITE'],
                ['Aliquota Efetiva (Aprox.)', `${((monthlyTax / (totalRevenue || 1)) * 100).toFixed(2)}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
        });
    }

    // Professional Disclaimer & Signature Area
    const finalY = doc.lastAutoTable.finalY + 20;
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, finalY, 196, finalY); // Horizontal separator

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
        normalizeForPDF('Este documento foi gerado pela plataforma Lumini I.A para fins de planejamento e estimativa fiscal.'),
        14,
        finalY + 10
    );
    doc.text(
        normalizeForPDF('Os valores sao calculados com base nas tabelas vigentes, mas podem sofrer variacoes conforme legislacao especifica.'),
        14,
        finalY + 15
    );
    doc.text(
        normalizeForPDF('Recomendamos que este relatorio seja validado pelo seu contador antes da emissao de guias oficiais.'),
        14,
        finalY + 20
    );

    // Accountant Signature Section
    doc.setDrawColor(0);
    doc.line(14, finalY + 45, 100, finalY + 45); // Signature line
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(normalizeForPDF('Validacao do Contador Responsavel'), 14, finalY + 52);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(normalizeForPDF('Carimbo / Assinatura'), 14, finalY + 57);

    doc.save(`lumini-relatorio-fiscal-${mode}.pdf`);
    showAlert('Sucesso', 'Relatório profissional gerado com sucesso!', 'success');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0">
            <h2 className="text-2xl font-bold text-white">Central Fiscal Lumini</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 pt-4 overflow-y-auto flex-1">
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
            <button 
                onClick={() => setMode('mei')}
                className={`flex-1 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${mode === 'mei' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                MEI
            </button>
            <button 
                onClick={() => {
                    if (isPro) {
                        setMode('simples');
                    } else {
                        showAlert('Premium Feature', 'Simulação Simples Nacional é exclusiva PRO.', 'locked');
                    }
                }}
                className={`flex-1 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 ${mode === 'simples' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'} ${!isPro ? 'opacity-75' : ''}`}
            >
                Simples
                {!isPro && <span>🔒</span>}
            </button>
            <button 
                onClick={() => setMode('irpf')}
                className={`flex-1 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${mode === 'irpf' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                IRPF (Pessoa Física)
            </button>
        </div>

        <div className="space-y-4">
          
          {/* MEI / SIMPLES INPUTS */}
          {(mode === 'mei' || mode === 'simples') && (
            <>
                {mode === 'simples' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Anexo (Tipo de Serviço)</label>
                        <select 
                            value={anexo}
                            onChange={(e) => setAnexo(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="III">Anexo III (Serviços Gerais - 6%)</option>
                            <option value="V">Anexo V (Intelectual - 15.5%)</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Faturamento Mensal (Serviço)</label>
                    <input 
                    type="text" 
                    value={revenue.service === 0 ? '' : revenue.service}
                    onChange={(e) => setRevenue({...revenue, service: e.target.value.replace(/[^0-9.,]/g, '')})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 4.500,00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Faturamento Mensal (Comércio)</label>
                    <input 
                    type="text" 
                    value={revenue.commerce === 0 ? '' : revenue.commerce}
                    onChange={(e) => setRevenue({...revenue, commerce: e.target.value.replace(/[^0-9.,]/g, '')})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 2.000,00"
                    />
                </div>

                <div className="bg-slate-800 p-4 rounded-lg space-y-3 mt-4">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                        <span className="text-gray-300">Imposto Mensal (Estimado):</span>
                        <span className="text-xl font-bold text-white">R$ {calculateDAS().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Projeção Anual:</span>
                        <span className={`font-bold ${isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                            R$ {annualProjection.toLocaleString()}
                        </span>
                    </div>
                    {isOverLimit && (
                        <p className="text-xs text-red-400 mt-2">
                            Aviso: Você pode exceder o limite anual do {mode === 'mei' ? 'MEI' : 'Simples Nacional'}.
                        </p>
                    )}
                </div>
            </>
          )}

          {/* IRPF INPUTS */}
          {mode === 'irpf' && (
             <>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Renda Bruta Mensal (Salário)</label>
                    <input 
                    type="text" 
                    value={irpfData.grossIncome === 0 ? '' : irpfData.grossIncome}
                    onChange={(e) => setIrpfData({...irpfData, grossIncome: e.target.value.replace(/[^0-9.,]/g, '')})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 5.000,00"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Dependentes</label>
                        <input 
                        type="number" 
                        value={irpfData.dependents}
                        onChange={(e) => setIrpfData({...irpfData, dependents: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                        min="0"
                        step="1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Outras Deduções</label>
                        <input 
                        type="text" 
                        value={irpfData.otherDeductions === 0 ? '' : irpfData.otherDeductions}
                        onChange={(e) => setIrpfData({...irpfData, otherDeductions: e.target.value.replace(/[^0-9.,]/g, '')})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: 150,00"
                        />
                    </div>
                </div>

                {(() => {
                    const res = calculateIRPF();
                    return (
                        <div className="bg-slate-800 p-4 rounded-lg space-y-3 mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm">(-) INSS Estimado:</span>
                                <span className="text-white">R$ {res.inss.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                                <span className="text-gray-300 text-sm">Base de Cálculo:</span>
                                <span className="text-white">R$ {res.baseCalc.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-gray-300 font-bold">Imposto a Pagar (IRPF):</span>
                                <span className="text-xl font-bold text-red-400">R$ {res.irpf.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-sm">Salário Líquido Est.:</span>
                                <span className="text-green-400 font-bold">R$ {res.netIncome.toFixed(2)}</span>
                            </div>
                        </div>
                    );
                })()}
             </>
          )}

          <button 
            onClick={() => {
                if (isPro) {
                    generatePDF();
                } else {
                    showAlert('Recurso Premium', 'A exportação de PDF é exclusiva para usuários PRO.', 'locked');
                }
            }}
            className={`w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-all mt-4 border border-slate-700 flex justify-center items-center gap-2 ${!isPro ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Exportar Relatório PDF
            {!isPro && <span>🔒</span>}
          </button>

          <button 
            onClick={onClose}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-all mt-2"
          >
            Fechar Simulador
          </button>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSimulatorModal;
