/**
 * Script para criar contador fictício para testes
 * Uso: node backend/seed_accountant.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const testAccountant = {
  name: 'Lumini Contabilidade - Teste',
  email: 'contato@luminicontabil.com.br',
  phone: '(11) 98765-4321',
  specialty: 'MEI e Simples Nacional',
  description: 'Escritório especializado em gestão contábil para MEI, Micro e Pequenas Empresas. Oferecemos consultoria fiscal, abertura de empresa, imposto de renda e BPO financeiro com atendimento personalizado.',
  tags: JSON.stringify(['MEI', 'Simples Nacional', 'Abertura de Empresa', 'Imposto de Renda', 'BPO Financeiro']),
  crc: 'SP-123456/O-8', // CRC fictício válido
  image: null,
  verified: 1, // Já verificado para testes
  userId: null
};

db.serialize(() => {
  // Verificar se já existe
  db.get('SELECT id FROM accountants WHERE email = ?', [testAccountant.email], (err, row) => {
    if (err) {
      console.error('❌ Erro ao verificar contador:', err.message);
      db.close();
      return;
    }

    if (row) {
      console.log('⚠️  Contador fictício já existe!');
      console.log('📋 ID:', row.id);
      console.log('📧 Email:', testAccountant.email);
      console.log('✅ CRC:', testAccountant.crc);
      db.close();
      return;
    }

    // Inserir contador fictício
    const query = `
      INSERT INTO accountants (name, email, phone, specialty, description, tags, crc, image, verified, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    db.run(
      query,
      [
        testAccountant.name,
        testAccountant.email,
        testAccountant.phone,
        testAccountant.specialty,
        testAccountant.description,
        testAccountant.tags,
        testAccountant.crc,
        testAccountant.image,
        testAccountant.verified,
        testAccountant.status
      ],
      function(err) {
        if (err) {
          console.error('❌ Erro ao criar contador:', err.message);
          db.close();
          return;
        }

        console.log('\n🎉 ===== CONTADOR FICTÍCIO CRIADO COM SUCESSO! =====\n');
        console.log('📋 ID:', this.lastID);
        console.log('🏢 Nome:', testAccountant.name);
        console.log('📧 Email:', testAccountant.email);
        console.log('📱 Telefone:', testAccountant.phone);
        console.log('🎯 Especialidade:', testAccountant.specialty);
        console.log('📝 CRC:', testAccountant.crc);
        console.log('✅ Status:', testAccountant.status);
        console.log('✔️  Verificado:', testAccountant.verified ? 'Sim' : 'Não');
        console.log('\n💡 Agora você pode testar o Marketplace!\n');
        
        db.close();
      }
    );
  });
});
