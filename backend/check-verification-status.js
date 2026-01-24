const { Pool } = require('pg');

async function checkStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Verificando status de sundaragopaldas@gmail.com...\n');
    
    const result = await pool.query(
      'SELECT id, email, "emailVerified", "verificationToken", "createdAt" FROM "Users" WHERE email = $1',
      ['sundaragopaldas@gmail.com']
    );
    
    if (result.rowCount === 0) {
      console.log('❌ USUÁRIO NÃO EXISTE NO BANCO!');
      console.log('📝 Você precisa criar uma nova conta primeiro.');
    } else {
      const user = result.rows[0];
      console.log('✅ Usuário encontrado:');
      console.log('   📧 Email:', user.email);
      console.log('   🆔 ID:', user.id);
      console.log('   ✔️  Email Verificado:', user.emailVerified);
      console.log('   🔑 Token existe:', !!user.verificationToken);
      if (user.verificationToken) {
        console.log('   🔑 Token (primeiros 50 chars):', user.verificationToken.substring(0, 50) + '...');
      }
      console.log('   📅 Criado em:', user.createdAt);
      
      if (user.emailVerified) {
        console.log('\n✅ EMAIL JÁ FOI VERIFICADO! Você pode fazer login normalmente.');
      } else if (!user.verificationToken) {
        console.log('\n⚠️ Email NÃO verificado mas token foi usado/limpo. Algo deu errado.');
      } else {
        console.log('\n📧 Email NÃO verificado. O token está aguardando confirmação.');
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkStatus();
