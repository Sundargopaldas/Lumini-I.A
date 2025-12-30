
class NfeService {
    /**
     * Simulates emitting an NF-e for a transaction
     * @param {Object} transaction - The transaction object
     * @param {Object} user - The user object (emitter)
     */
    async emitNfe(transaction, user) {
        console.log(`[NfeService] Emitting NF-e for Transaction #${transaction.id} by User ${user.email}`);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Validation (Simulated)
        if (!user.cpfCnpj) {
            throw new Error("CPF/CNPJ do emissor não configurado.");
        }

        if (transaction.type !== 'income') {
            throw new Error("Apenas receitas podem gerar NF-e.");
        }

        // Mock Success
        // Generate a 44-digit Access Key (Chave de Acesso)
        // Format: UF(2) + AAMM(4) + CNPJ(14) + MOD(2) + SER(3) + NNF(9) + TP(1) + CODE(8) + DV(1)
        const randomDigits = (length) => Array.from({length}, () => Math.floor(Math.random() * 10)).join('');
        const uf = '35'; // SP
        const date = new Date();
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const cnpj = user.cpfCnpj ? user.cpfCnpj.replace(/\D/g, '').padStart(14, '0') : '00000000000000';
        const model = '55';
        const series = '001';
        const number = randomDigits(9);
        const type = '1';
        const code = randomDigits(8);
        
        let nfeAccessKey = `${uf}${yy}${mm}${cnpj}${model}${series}${number}${type}${code}`;
        // Calculate Check Digit (Simplified for mock)
        const dv = Math.floor(Math.random() * 10); 
        nfeAccessKey += dv;

        // Keep the old key for URL compatibility if needed, but Access Key is the standard
        const nfeKey = `NFE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const pdfUrl = `https://www.nfe.fazenda.gov.br/portal/exibir.aspx?key=${nfeAccessKey}`; // Fake URL

        return {
            status: 'emitted',
            nfeKey, // Legacy ID
            nfeAccessKey, // The 44-digit barcode key
            pdfUrl,
            emittedAt: new Date()
        };
    }
}

module.exports = new NfeService();
