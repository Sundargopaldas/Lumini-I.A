const { chatWithAI } = require('./services/geminiService');
require('dotenv').config();

// Mock Data
const user = { id: 1, username: 'TestUser', plan: 'free' };
const transactions = [
    { type: 'income', amount: 5000, date: new Date() },
    { type: 'expense', amount: 1200, date: new Date() },
    { type: 'expense', amount: 300, date: new Date() }
];
const goals = [];

async function testChat() {
    console.log('Testing Chat with AI Fallback & Trust Building...');

    try {
        // Test 1: Trust/Skepticism (Should trigger friendly fallback with WhatsApp hint)
        const response1 = await chatWithAI(user, transactions, goals, "na verdade nunca confiei nesses chats pois eles sempre falham");
        console.log('\nUser: na verdade nunca confiei nesses chats pois eles sempre falham');
        console.log('AI:', response1);

        // Test 2: "Balanço Mensal" (Should trigger the new calculation logic)
        const response2 = await chatWithAI(user, transactions, goals, "como posso fazer um balanço mensal?");
        console.log('\nUser: como posso fazer um balanço mensal?');
        console.log('AI:', response2);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testChat();