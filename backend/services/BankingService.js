// Service to handle Open Finance integrations (Nubank, Inter, Itaú, etc.)
// In Production, we use providers like Pluggy (Brazil) or Plaid (Global).
// Documentation: https://docs.pluggy.ai/

const USE_SANDBOX = true; // Set to FALSE when you have real API Keys

class BankingService {
    
    /**
     * Connects to the bank provider API.
     * @param {string} bankName - The bank identifier
     * @param {string} accessToken - The user's secure token (provided by Pluggy/Belvo)
     */
    static async fetchTransactions(bankName, accessToken = null) {
      if (USE_SANDBOX) {
          return this.mockBankResponse(bankName);
      }

      // -----------------------------------------------------------------------
      // REAL IMPLEMENTATION (Example with Pluggy SDK)
      // -----------------------------------------------------------------------
      /*
      try {
        const client = new PluggyClient({
          clientId: process.env.PLUGGY_CLIENT_ID,
          clientSecret: process.env.PLUGGY_CLIENT_SECRET,
        });

        // 1. Fetch transactions from the connected item
        const response = await client.fetchTransactions(accessToken);
        
        // 2. Normalize data to our format
        return response.results.map(tx => ({
            description: tx.description,
            amount: tx.amount,
            type: tx.amount < 0 ? 'expense' : 'income',
            source: tx.category || 'Bank',
            date: tx.date
        }));
      } catch (error) {
        console.error('Banking API Error:', error);
        throw new Error('Failed to sync with bank.');
      }
      */
    }

    // -------------------------------------------------------------------------
    // SANDBOX / SIMULATION MODE
    // -------------------------------------------------------------------------
    static async mockBankResponse(bankName) {
      console.log(`[BankingService] (Sandbox) Connecting to ${bankName}...`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Latency sim
  
      // Get today's date in Brazil timezone (UTC-3)
      // Brazil is 3 hours BEHIND UTC, so we SUBTRACT 3 hours
      const now = new Date();
      const brazilOffsetHours = -3; // UTC-3
      const brazilTime = new Date(now.getTime() + (brazilOffsetHours * 60 * 60 * 1000));
      const today = brazilTime.toISOString().split('T')[0];
      
      console.log(`[BankingService] UTC Time: ${now.toISOString()}`);
      console.log(`[BankingService] Brazil Time: ${brazilTime.toISOString()}`);
      console.log(`[BankingService] Today's date: ${today}`);
  
      if (bankName === 'Nubank') {
        return [
          { external_id: 'n_1', description: 'Compra no Supermercado', amount: -150.75, type: 'expense', category: 'Alimentação', date: today }
        ];
      }
      return [];
    }
  }
  
  module.exports = BankingService;