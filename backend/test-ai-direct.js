const { generateFinancialInsights } = require('./services/geminiService');
require('dotenv').config();

const mockUser = {
    username: "Test User",
    plan: "PREMIUM"
};

const mockTransactions = [
    { date: '2023-10-01', description: 'Salary', type: 'income', amount: 5000, source: 'Job' },
    { date: '2023-10-05', description: 'Rent', type: 'expense', amount: 1500, source: 'Housing' },
    { date: '2023-10-10', description: 'Grocery', type: 'expense', amount: 500, source: 'Food' }
];

const mockGoals = [
    { name: 'New Car', currentAmount: 1000, targetAmount: 20000, deadline: '2024-12-31' }
];

async function runTest() {
    console.log("Testing Gemini Service directly...");
    try {
        const insights = await generateFinancialInsights(mockUser, mockTransactions, mockGoals);
        console.log("\n--- INSIGHTS GENERATED ---");
        console.log(insights);
        console.log("--------------------------");
    } catch (error) {
        console.error("TEST FAILED:", error);
    }
}

runTest();
