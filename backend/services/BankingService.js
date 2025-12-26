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
  
      const today = new Date().toISOString().split('T')[0];
  
      if (bankName === 'Nubank') {
        return [
          { external_id: 'n_1', description: 'Uber *Trip', amount: -24.90, type: 'expense', category: 'Transport', date: today },
          { external_id: 'n_2', description: 'Spotify Premium', amount: -21.90, type: 'expense', category: 'Subscriptions', date: today },
          { external_id: 'n_3', description: 'Starbucks Coffee', amount: -18.50, type: 'expense', category: 'Food', date: today }
        ];
      }
      return [];
    }
  }
  
  module.exports = BankingService;