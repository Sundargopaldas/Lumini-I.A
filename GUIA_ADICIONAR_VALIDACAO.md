# 📋 GUIA: Como Adicionar Validação em Novas Rotas

## 🎯 OBJETIVO

Este guia mostra como usar o sistema de validação Joi implementado em novas rotas do Lumini I.A.

---

## ✅ PASSO A PASSO

### 1️⃣ Criar Schema de Validação

Abra `backend/middleware/validator.js` e adicione seu schema:

```javascript
// No final do arquivo, antes do module.exports
const seuSchema = Joi.object({
  campo1: Joi.string().required(),
  campo2: Joi.number().min(0).optional(),
  email: Joi.string().email().required(),
  data: Joi.date().greater('now').optional()
});
```

### 2️⃣ Exportar o Schema

```javascript
// No module.exports
module.exports = {
  validate,
  schemas: {
    registerSchema,
    loginSchema,
    // ... outros schemas
    seuSchema  // ← ADICIONAR AQUI
  }
};
```

### 3️⃣ Usar na Rota

No arquivo da rota (ex: `backend/routes/sua-rota.js`):

```javascript
// Importar no topo
const { validate, schemas } = require('../middleware/validator');

// Aplicar na rota
router.post('/endpoint', auth, validate(schemas.seuSchema), async (req, res) => {
  // req.body já está validado e sanitizado!
  const { campo1, campo2 } = req.body;
  
  // Seu código aqui
});
```

---

## 📚 TIPOS DE VALIDAÇÃO

### String
```javascript
Joi.string()
  .min(3)              // Mínimo 3 caracteres
  .max(100)            // Máximo 100 caracteres
  .alphanum()          // Apenas letras e números
  .email()             // Email válido
  .required()          // Obrigatório
  .optional()          // Opcional
  .default('valor')    // Valor padrão
```

### Number
```javascript
Joi.number()
  .integer()           // Inteiro
  .positive()          // Positivo
  .negative()          // Negativo
  .min(0)              // Mínimo
  .max(1000)           // Máximo
  .required()
```

### Date
```javascript
Joi.date()
  .greater('now')      // No futuro
  .less('now')         // No passado
  .iso()               // Formato ISO
  .required()
```

### Boolean
```javascript
Joi.boolean()
  .required()
```

### Enum (Valores Específicos)
```javascript
Joi.string()
  .valid('valor1', 'valor2', 'valor3')
  .required()
```

### Array
```javascript
Joi.array()
  .items(Joi.string())  // Array de strings
  .min(1)               // Mínimo 1 item
  .max(10)              // Máximo 10 itens
  .required()
```

### Object
```javascript
Joi.object({
  nome: Joi.string().required(),
  idade: Joi.number().min(18)
})
```

---

## 🎨 MENSAGENS CUSTOMIZADAS

```javascript
const schema = Joi.object({
  username: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.min': 'Username deve ter no mínimo 3 caracteres',
      'string.empty': 'Username não pode ser vazio',
      'any.required': 'Username é obrigatório'
    }),
    
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório'
    })
});
```

---

## 🔧 EXEMPLOS PRÁTICOS

### Exemplo 1: Criar Meta Financeira

```javascript
// backend/middleware/validator.js
const createGoalSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  targetAmount: Joi.number().positive().required(),
  deadline: Joi.date().greater('now').required(),
  category: Joi.string().max(50).optional()
});

// backend/routes/goals.js
router.post('/', auth, validate(schemas.createGoalSchema), async (req, res) => {
  const { title, targetAmount, deadline, category } = req.body;
  // Dados já validados!
});
```

### Exemplo 2: Atualizar Perfil

```javascript
// backend/middleware/validator.js
const updateProfileSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\d{10,11}$/).optional(),
  address: Joi.string().max(200).optional()
});

// backend/routes/auth.js
router.put('/profile', auth, validate(schemas.updateProfileSchema), async (req, res) => {
  // req.body validado
});
```

### Exemplo 3: Filtros de Busca (Query Params)

```javascript
// backend/middleware/validator.js
const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('date', 'amount', 'name').default('date')
});

// backend/routes/search.js
router.get('/', auth, validate(searchSchema, 'query'), async (req, res) => {
  //                           ↑ Validar query params, não body
  const { query, page, limit, sortBy } = req.query;
});
```

---

## 🛡️ VALIDAÇÃO POR TIPO

### Body (POST/PUT) - Padrão
```javascript
router.post('/', auth, validate(schemas.meuSchema), async (req, res) => {
  // Valida req.body
});
```

### Query (GET) - Filtros
```javascript
router.get('/', auth, validate(schemas.meuSchema, 'query'), async (req, res) => {
  // Valida req.query
});
```

### Params (URL) - IDs
```javascript
router.get('/:id', auth, validate(schemas.idSchema, 'params'), async (req, res) => {
  // Valida req.params
});
```

---

## ⚡ DICAS PRO

### 1. Reutilizar Schemas
```javascript
// Criar schemas base
const baseUserSchema = {
  name: Joi.string().max(100),
  email: Joi.string().email()
};

// Estender
const createUserSchema = Joi.object({
  ...baseUserSchema,
  password: Joi.string().min(8).required()
});

const updateUserSchema = Joi.object(baseUserSchema);
```

### 2. Validação Condicional
```javascript
const schema = Joi.object({
  type: Joi.string().valid('pessoa', 'empresa').required(),
  cpf: Joi.when('type', {
    is: 'pessoa',
    then: Joi.string().length(11).required(),
    otherwise: Joi.forbidden()
  }),
  cnpj: Joi.when('type', {
    is: 'empresa',
    then: Joi.string().length(14).required(),
    otherwise: Joi.forbidden()
  })
});
```

### 3. Strip Unknown (Remover campos extras)
```javascript
// Já configurado no middleware!
// stripUnknown: true remove campos não definidos no schema
```

---

## 🚨 ERROS COMUNS

### ❌ Erro: "Schema is not a Joi schema"
```javascript
// ERRADO
validate(meuSchema)

// CORRETO
validate(schemas.meuSchema)
```

### ❌ Erro: "Cannot read property 'validate' of undefined"
```javascript
// ERRADO - Esqueceu de importar
router.post('/', validate(schemas.meuSchema), ...)

// CORRETO
const { validate, schemas } = require('../middleware/validator');
router.post('/', validate(schemas.meuSchema), ...)
```

### ❌ Validação não funciona
```javascript
// ERRADO - Middleware na ordem errada
router.post('/', validate(schemas.meuSchema), auth, ...)

// CORRETO - Auth primeiro, depois validação
router.post('/', auth, validate(schemas.meuSchema), ...)
```

---

## 📋 CHECKLIST

Ao adicionar validação em uma nova rota:

- [ ] 1. Criar schema em `validator.js`
- [ ] 2. Exportar schema no `module.exports`
- [ ] 3. Importar `{ validate, schemas }` na rota
- [ ] 4. Adicionar middleware `validate(schemas.seuSchema)`
- [ ] 5. Colocar após `auth`, mas antes da lógica
- [ ] 6. Testar com dados válidos
- [ ] 7. Testar com dados inválidos
- [ ] 8. Verificar mensagens de erro

---

## 🧪 TESTAR VALIDAÇÃO

### Postman / Insomnia:
```json
POST /api/sua-rota
Headers: { "Authorization": "Bearer TOKEN" }
Body: {
  "campo1": "valor válido",
  "campo2": 123
}

// Deve retornar 200 OK

Body: {
  "campo1": "",  // ← Inválido
  "campo2": "abc"  // ← Inválido
}

// Deve retornar 400 Bad Request com detalhes dos erros
```

### Frontend (Axios):
```javascript
try {
  const response = await api.post('/endpoint', data);
  // Sucesso
} catch (error) {
  if (error.response?.status === 400) {
    // Erro de validação
    const errors = error.response.data.errors;
    errors.forEach(err => {
      console.log(`${err.field}: ${err.message}`);
    });
  }
}
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Joi Docs: https://joi.dev/api/

---

**💡 Dica:** Sempre valide inputs! É a primeira linha de defesa contra bugs e ataques.

**🎉 Pronto!** Agora você sabe como adicionar validação profissional em qualquer rota!
