const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLinkFlow() {
    try {
        console.log('--- Starting Link Flow Test ---');

        // 0. Create Test User (if needed)
        const testEmail = `test${Date.now()}@example.com`;
        const testPassword = 'password123';
        console.log('0. Creating test user:', testEmail);
        try {
            await axios.post(`${API_URL}/auth/register`, {
                username: `testuser${Date.now()}`,
                email: testEmail,
                password: testPassword
            });
            console.log('User created.');
        } catch (e) {
            console.log('User creation failed (might exist):', e.message);
        }

        // 1. Login to get token
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: testEmail, 
            password: testPassword
        });
        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;
        console.log('Login successful. User ID:', userId);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get Accountants
        console.log('2. Fetching accountants...');
        const accRes = await axios.get(`${API_URL}/accountants`, { headers });
        const accountants = accRes.data;
        if (accountants.length === 0) {
            console.error('No accountants found. Cannot test linking.');
            return;
        }
        const accountantId = accountants[0].id;
        console.log('Found accountant ID:', accountantId);

        // 3. Unlink first (to ensure clean state)
        console.log('3. Unlinking any existing accountant...');
        try {
            await axios.post(`${API_URL}/accountants/unlink`, {}, { headers });
            console.log('Unlink successful.');
        } catch (e) {
            console.log('Unlink failed (maybe not linked):', e.message);
        }

        // 4. Verify user is unlinked
        console.log('4. Verifying unlinked state...');
        let meRes = await axios.get(`${API_URL}/auth/me`, { headers });
        if (meRes.data.accountantId) {
            console.error('User still linked!', meRes.data.accountantId);
        } else {
            console.log('User is unlinked (accountantId is null).');
        }

        // 5. Link
        console.log(`5. Linking to accountant ${accountantId}...`);
        await axios.post(`${API_URL}/accountants/link`, { accountantId }, { headers });
        console.log('Link request successful.');

        // 6. Verify user is linked
        console.log('6. Verifying linked state...');
        meRes = await axios.get(`${API_URL}/auth/me`, { headers });
        if (meRes.data.accountantId === accountantId) {
            console.log('SUCCESS: User is linked correctly!');
        } else {
            console.error('FAILURE: User is NOT linked. AccountantId:', meRes.data.accountantId);
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testLinkFlow();
