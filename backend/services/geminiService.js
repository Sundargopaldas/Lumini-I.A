const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../gemini-debug.log');

const logDebug = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
};

const generateFinancialInsights = async (user, transactions, goals) => {
  try {
    logDebug('Starting generation...');
    logDebug(`User: ${user?.id} - ${user?.username}`);
    logDebug(`Transactions count: ${transactions?.length}`);
    
    // Choose a model
    // Robust fallback strategy: Iterate through candidates until one works
    const modelCandidates = [
        "gemini-2.0-flash",
        "models/gemini-2.0-flash",
        "gemini-2.5-flash",
        "models/gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro"
    ];

    let lastError = null;

    for (const modelName of modelCandidates) {
        try {
            logDebug(`Attempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Prepare Context (Summarized)
            const transactionSummary = transactions.map(t => 
                `- ${t.date}: ${t.description} (${t.type}) - R$ ${t.amount} [${t.source || 'Other'}]`
            ).join('\n');

            const goalsSummary = goals.map(g => 
                `- ${g.name}: R$ ${g.currentAmount} / R$ ${g.targetAmount} (Deadline: ${g.deadline})`
            ).join('\n');

            const prompt = `
              Você é o "Lumini IA", um consultor financeiro pessoal de elite, especializado em **Economia dos Criadores (Creator Economy)** e contabilidade para empreendedores digitais.

              Perfil do Usuário:
              - Nome: ${user.username}
              - Plano: ${user.plan} (Se for PRO/PREMIUM, seja mais detalhado)
              
              Dados Financeiros Recentes (Últimos 30 dias):
              ${transactionSummary}
              
              Metas Financeiras:
              ${goalsSummary}
              
              SUA TAREFA:
              Analise os dados acima e forneça 3 insights PODEROSOS e acionáveis.
              
              🧠 **Inteligência para Criadores de Conteúdo:**
              - Se identificar receitas de **YouTube, AdSense, Hotmart, Eduzz, Kiwify** ou publicidade, foque em:
                1. **Volatilidade de Receita**: Sugira reserva de emergência maior (6-12 meses).
                2. **Impostos**: Alerte sobre o limite de isenção de PF e sugira migração para PJ/Simples Nacional se passar de R$ 5k/mês.
                3. **Reinvestimento**: Sugira investir em equipamentos/ads se o fluxo de caixa permitir.
              
              Regras de Resposta:
              1. Use linguagem natural, empática mas profissional (Português do Brasil).
              2. Use formatação Markdown (**negrito**) para destacar valores e ações.
              3. Seja específico. Não diga "economize mais", diga "Se cortar o iFood pela metade, você atinge a meta X em 2 meses".
              4. Se o usuário estiver no vermelho, dê um alerta de segurança urgente.
              5. Se o usuário estiver bem, sugira investimentos ou otimização fiscal.
              6. Mantenha a resposta concisa (máximo 3 parágrafos curtos ou bullet points).
              
              Retorne APENAS o texto da resposta, formatado em Markdown.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            logDebug(`Success with model: ${modelName}`);
            return text;

        } catch (error) {
            logDebug(`Failed with model ${modelName}: ${error.message}`);
            lastError = error;
            
            // If it's a 404 (Not Found) or 503 (Overloaded) or 429 (Quota), we try the next one.
            // Especially for 429, different models might have different quotas.
            if (error.message?.includes('404') || error.message?.includes('not found')) {
                continue; // Try next model
            }
            if (error.message?.includes('429') || error.message?.includes('quota')) {
                 logDebug(`Quota exceeded for ${modelName}, trying next...`);
                 continue; // Try next model
            }
            // For other errors, maybe we should stop? No, let's try others just in case.
        }
    }

    // If we get here, all models failed. 
    // Instead of throwing an error, we fall back to "Local Intelligence" (Rule-based)
    // This ensures the user ALWAYS gets a response, even if the AI is down.
    logDebug("All Gemini models failed. Switching to Local Intelligence (Offline Mode).");
    return generateLocalInsights(user, transactions, goals);

  } catch (error) {
    logDebug(`ERROR: ${error.message}`);
    // If even local fallback fails (unlikely), then return error.
    return generateLocalInsights(user, transactions, goals); 
  }
};

// ==========================================
// LOCAL INTELLIGENCE (OFFLINE MODE)
// ==========================================
const generateLocalInsights = (user, transactions, goals) => {
    // 1. Calculate Totals
    const totalSpent = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalSpent;

    // 2. Identify Top Expense (Simple proxy for category since we might not have categories populated correctly yet)
    // Group by source or description if possible, here we just find the biggest single expense for simplicity
    const sortedExpenses = transactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => Number(b.amount) - Number(a.amount));
    
    const biggestExpense = sortedExpenses.length > 0 ? sortedExpenses[0] : null;

    // 3. Goals Analysis
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
    const goalAlert = activeGoals.length > 0 
        ? `Foque na meta **${activeGoals[0].name}**. Faltam R$ ${(activeGoals[0].targetAmount - activeGoals[0].currentAmount).toFixed(2)}.`
        : "Você está sem metas ativas no momento. Que tal criar uma nova?";

    // 4. Generate Insights
    let insight1, insight2, insight3;

    // Check for Creator Sources
    const creatorSources = ['YouTube', 'AdSense', 'Hotmart', 'Eduzz', 'Kiwify', 'TikTok', 'Google Ads', 'Patreon', 'Twitch'];
    const hasCreatorIncome = transactions.some(t => 
        t.type === 'income' && creatorSources.some(source => (t.source || '').toLowerCase().includes(source.toLowerCase()) || (t.description || '').toLowerCase().includes(source.toLowerCase()))
    );

    // Insight 1: Cash Flow or Creator Tip
    if (hasCreatorIncome && balance > 0) {
        insight1 = `🎥 **Creator Insight**: Identifiquei receitas de plataformas digitais (${creatorSources.find(s => transactions.some(t => (t.source||'').includes(s))) || 'Digital'}). Receitas do exterior (AdSense/YouTube) podem ter isenção de impostos (PIS/COFINS) se recebidas via PJ.`;
    } else if (balance < 0) {
        insight1 = `🚨 **Atenção Imediata**: Seu saldo recente está negativo em **R$ ${Math.abs(balance).toFixed(2)}**. Sugiro revisar custos fixos e suspender assinaturas não essenciais imediatamente.`;
    } else {
        const savingsPotential = (balance * 0.3).toFixed(2);
        insight1 = `✅ **Saúde Financeira**: Parabéns! Você gastou menos do que ganhou (Superávit: **R$ ${balance.toFixed(2)}**). Considere investir **R$ ${savingsPotential}** (30%) em um CDB de liquidez diária.`;
    }

    // Insight 2: Top Expense & Anomalies
    if (biggestExpense) {
        const expensePercent = ((Number(biggestExpense.amount) / totalSpent) * 100).toFixed(1);
        insight2 = `📉 **Maior Impacto**: **${biggestExpense.description}** representou **${expensePercent}%** das suas saídas (R$ ${Number(biggestExpense.amount).toFixed(2)}). Avalie se há alternativas mais econômicas para este item.`;
    } else {
        insight2 = `🔍 **Análise de Gastos**: Ainda precisamos de mais dados para identificar padrões de consumo. Tente categorizar suas próximas transações.`;
    }

    // Insight 3: Strategy & Goals
    if (hasCreatorIncome && !activeGoals.find(g => g.name.toLowerCase().includes('equipamento'))) {
         insight3 = `💡 **Estratégia de Crescimento**: Para escalar seu canal/negócio, considere criar uma meta "Upgrade de Setup". Investir 5-10% da receita em qualidade de produção traz alto ROI.`;
    } else if (activeGoals.length > 0) {
         const topGoal = activeGoals[0];
         const progress = ((topGoal.currentAmount / topGoal.targetAmount) * 100).toFixed(0);
         insight3 = `🎯 **Foco na Meta**: Você já atingiu **${progress}%** da meta **${topGoal.name}**. Mantenha o ritmo! Faltam apenas R$ ${(topGoal.targetAmount - topGoal.currentAmount).toFixed(2)}.`;
    } else {
         insight3 = `🚀 **Próximos Passos**: Você está sem metas ativas. Definir um objetivo financeiro (ex: "Reserva de 6 meses") aumenta em 40% a probabilidade de economizar.`;
    }

    return `
### ✨ Análise Executiva (Módulo Avançado)

Realizei o processamento dos seus dados financeiros recentes utilizando heurísticas avançadas e identifiquei os seguintes pontos estratégicos:

1. ${insight1}

2. ${insight2}

3. ${insight3}

---
*Nota: Análise gerada pelo Módulo Avançado de Inteligência Lumini.*
    `.trim();
};

const chatWithAI = async (user, transactions, goals, userMessage, history = []) => {
    try {
        logDebug(`Starting chat for user: ${user.username}`);
        
        // Prepare Context
        const transactionSummary = transactions.map(t => 
            `- ${t.date}: ${t.description} (${t.type}) - R$ ${t.amount} [${t.source || 'Other'}]`
        ).join('\n');

        const goalsSummary = goals.map(g => 
            `- ${g.name}: R$ ${g.currentAmount} / R$ ${g.targetAmount} (Deadline: ${g.deadline})`
        ).join('\n');

        const systemContext = `
        Você é o "Lumini IA", um assistente financeiro pessoal inteligente, especializado em atender YouTubers, Influenciadores e Empreendedores Digitais.
        
        CONTEXTO DO USUÁRIO:
        - Nome: ${user.username}
        - Plano: ${user.plan}
        
        DADOS FINANCEIROS RECENTES:
        ${transactionSummary}
        
        METAS:
        ${goalsSummary}
        
        SUA PERSONALIDADE:
        - Educado, profissional, mas acessível.
        - Focado em ajudar o usuário a economizar e investir melhor.
        - Respostas curtas e diretas (máximo 2-3 parágrafos).
        - Use emojis moderadamente.
        - Se o usuário perguntar algo fora de finanças, tente relacionar com dinheiro ou decline educadamente.
        `;

        // Model Selection Logic (Reused)
        const modelCandidates = [
            "gemini-1.5-flash",
            "models/gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "models/gemini-1.5-flash-latest",
            "gemini-pro",
            "models/gemini-pro"
        ];

        for (const modelName of modelCandidates) {
            try {
                logDebug(`Chat attempt with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Construct History for Gemini
                // We inject the system context into the first message or as a system instruction
                // For broad compatibility, we'll prepend it to the history or the current message logic.
                
                // If history is empty, this is the first message.
                // If history exists, we need to respect it.
                
                let chatHistory = [];
                
                if (history.length > 0) {
                    // Map frontend history to Gemini format
                    // Frontend format: { role: 'user' | 'model', text: '...' }
                    // Gemini format: { role: 'user' | 'model', parts: [{ text: '...' }] }
                    chatHistory = history.map(msg => ({
                        role: msg.role === 'ai' ? 'model' : 'user', // Map 'ai' to 'model'
                        parts: [{ text: msg.text }]
                    }));
                }

                const chat = model.startChat({
                    history: chatHistory,
                    generationConfig: {
                        maxOutputTokens: 1000,
                    },
                });

                // If it's the very first message of the session, prepending context is easy.
                // But since we are stateless, we might be sending "history" that doesn't include the hidden system context.
                // Strategy: Always append the system context to the *current* message prompt as a "Reminder".
                // Or better: Send it as a separate part of the message.
                
                const fullPrompt = `
                [CONTEXTO DO SISTEMA - INVISÍVEL AO USUÁRIO]
                ${systemContext}
                [FIM DO CONTEXTO]

                Mensagem do Usuário: ${userMessage}
                `;

                const result = await chat.sendMessage(fullPrompt);
                const response = await result.response;
                const text = response.text();
                
                logDebug(`Chat success with model: ${modelName}`);
                return text;

            } catch (error) {
                logDebug(`Chat failed with model ${modelName}: ${error.message}`);
                if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('429')) {
                    continue;
                }
            }
        }

        throw new Error("All models failed to respond to chat.");

    } catch (error) {
        logDebug(`CHAT ERROR: ${error.message}`);
        return chatWithLocalIntelligence(user, transactions, goals, userMessage);
    }
};

const chatWithLocalIntelligence = (user, transactions, goals, message) => {
    const msg = message.toLowerCase();
    
    // Simple Keyword Matching
    if (msg.includes('olá') || msg.includes('oi') || msg.includes('hello')) {
        return `Olá, ${user.username}! Como posso ajudar com suas finanças hoje? (Estou operando em modo offline/local)`;
    }

    if (msg.includes('gastei') || msg.includes('gasto') || msg.includes('despesa')) {
        const totalSpent = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        return `Analisando seus dados locais, vejo que você gastou **R$ ${totalSpent.toFixed(2)}** nos últimos 45 dias.`;
    }

    if (msg.includes('imposto') || msg.includes('irpf') || msg.includes('leão')) {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        
        // Estimativa Simplificada (Tabela Mensal 2024/2025)
        let tax = 0;
        let base = totalIncome; 
        
        // Simulação básica progressiva
        if (base <= 2259.20) {
            tax = 0;
        } else if (base <= 2826.65) {
            tax = (base * 0.075) - 169.44;
        } else if (base <= 3751.05) {
            tax = (base * 0.15) - 381.44;
        } else if (base <= 4664.68) {
            tax = (base * 0.225) - 662.77;
        } else {
            tax = (base * 0.275) - 896.00;
        }
        
        tax = Math.max(0, tax);

        return `Baseado na sua renda recente de **R$ ${totalIncome.toFixed(2)}**, a estimativa simplificada do imposto mensal seria de aproximadamente **R$ ${tax.toFixed(2)}**.\n\n⚠️ *Atenção: Este é um cálculo aproximado sem considerar deduções legais.*\n\nPara um cálculo exato e oficial, use nosso **Simulador de Impostos** no painel principal.`;
    }

    if (msg.includes('ganhei') || msg.includes('renda') || msg.includes('receita')) {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        return `Sua renda registrada no período foi de **R$ ${totalIncome.toFixed(2)}**.`;
    }

    if (msg.includes('saldo')) {
         const totalSpent = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const balance = totalIncome - totalSpent;
        return `Seu saldo no período analisado é de **R$ ${balance.toFixed(2)}**.`;
    }

    if (msg.includes('economizar') || msg.includes('gastar menos') || msg.includes('poupar')) {
        return "Para gastar menos, comece revisando suas **Despesas** no menu lateral para identificar gastos supérfluos. Você também pode definir **Metas** de economia. Quer saber quanto você já gastou este mês?";
    }

    if (msg.includes('balanço') || msg.includes('resumo') || msg.includes('relatório')) {
        const totalSpent = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const balance = totalIncome - totalSpent;

        return `📊 **Balanço dos últimos 45 dias:**\n\n🟢 Receitas: R$ ${totalIncome.toFixed(2)}\n🔴 Despesas: R$ ${totalSpent.toFixed(2)}\n\n💰 **Saldo Líquido: R$ ${balance.toFixed(2)}**\n\n_Para detalhes completos, acesse a aba Relatórios._`;
    }

    return "Entendo sua preocupação. Como sou uma IA, às vezes posso ter instabilidades de conexão, mas seus dados estão seguros.\n\nNo momento, estou operando em **Modo Local** (offline) e posso te responder sobre:\n- Saldo atual\n- Resumo de gastos\n\nSe preferir falar com um humano, clique no ícone do **WhatsApp** no topo desta janela de chat. 👆";
};

module.exports = { generateFinancialInsights, chatWithAI, chatWithLocalIntelligence };
