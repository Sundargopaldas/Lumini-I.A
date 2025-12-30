
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { chatWithAI } = require('./services/geminiService');

const mockUser = {
    id: 1,
    username: 'Test User',
    plan: 'premium'
};

const mockTransactions = [
    { date: '2024-05-01', description: 'Salary', type: 'income', amount: 5000, source: 'Job' },
    { date: '2024-05-05', description: 'Rent', type: 'expense', amount: 1500, source: 'Housing' },
    { date: '2024-05-10', description: 'Supermarket', type: 'expense', amount: 400, source: 'Food' }
];

const mockGoals = [
    { name: 'Car', currentAmount: 2000, targetAmount: 20000, deadline: '2025-12-31' }
];

const mockHistory = [
    { role: 'user', text: 'Olá' },
    { role: 'ai', text: 'Olá! Sou o Lumini IA. Como posso ajudar?' }
];

const testChat = async () => {
    try {
        console.log('Testing Chat with AI...');
        const response = await chatWithAI(mockUser, mockTransactions, mockGoals, 'Quanto eu gastei com comida?', mockHistory);
        console.log('\nAI Response:\n', response);
    } catch (error) {
        console.error('Test Failed:', error);
    }
};

testChat();
