const https = require('https');

const options = {
  hostname: 'lumini-i-a.fly.dev',
  port: 443,
  path: '/api/admin/promote-to-premium-temp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('🔄 Chamando API para promover usuário...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📥 Resposta recebida:\n');
    console.log(data);
    
    try {
      const json = JSON.parse(data);
      console.log('\n✅ SUCESSO!');
      console.log('👤 Usuário:', json.user.email);
      console.log('📊 Plano antigo:', json.user.oldPlan);
      console.log('💎 Plano novo:', json.user.newPlan);
    } catch (e) {
      console.log('\n❌ Erro ao parsear resposta');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error.message);
});

req.write(JSON.stringify({}));
req.end();
