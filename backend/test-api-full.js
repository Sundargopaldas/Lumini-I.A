const axios = require('axios');
const jwt = require('jsonwebtoken');

const secret = 'secret'; // Default secret from authMiddleware
const token = jwt.sign({ user: { id: 1 } }, secret, { expiresIn: '1h' });

console.log('Testing AI Route with token:', token);

async function testRoute() {
    try {
        console.log('Sending request to 127.0.0.1:5000...');
        const response = await axios.get('http://127.0.0.1:5000/api/ai/insights', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 30000
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Request Failed:', error.message);
        if (error.code === 'ECONNABORTED') {
            console.error('Timeout reached');
        }
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testRoute();
