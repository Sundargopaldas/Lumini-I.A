-- Promover usuário para Premium
UPDATE users 
SET plan = 'premium' 
WHERE email = 'contato@luminiiadigital.com.br';

-- Verificar resultado
SELECT id, email, name, plan 
FROM users 
WHERE email = 'contato@luminiiadigital.com.br';
