const { chatWithAI } = require('./services/geminiService');
require('dotenv').config();

// Mock Data
const user = { id: 1, username: 'TestUser', plan: 'free' };
const transactions = []; // Empty for this test
const goals = [];

async function testChat() {
    console.log('Testing Chat with AI Fallback...');

    try {
        // Test 1: Unknown Query (Should trigger friendly fallback)
        const response1 = await chatWithAI(user, transactions, goals, "Qual o sentido da vida?");
        console.log('\nUser: Qual o sentido da vida?');
        console.log('AI:', response1);

        // Test 2: "Gastar menos" (Should trigger specific advice)
        const response2 = await chatWithAI(user, transactions, goals, "Como posso gastar menos?");
        console.log('\nUser: Como posso gastar menos?');
        console.log('AI:', response2);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testChat();