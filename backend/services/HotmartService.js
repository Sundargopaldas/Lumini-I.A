// Service to handle Hotmart API (Mock/Sandbox)
const USE_SANDBOX = true; // Set to FALSE when you have real Hotmart Credentials

class HotmartService {
    
    /**
     * Fetches Hotmart sales data.
     * @param {string} apiKey - The user's Hotmart API Key
     */
    static async fetchSales(apiKey = null) {
      if (USE_SANDBOX) {
          return this.mockHotmartResponse();
      }

      // -----------------------------------------------------------------------
      // REAL IMPLEMENTATION (Placeholder)
      // -----------------------------------------------------------------------
      // In a real scenario, you would use axios to call Hotmart Developers API
      // Documentation: https://developers.hotmart.com/docs/en/v1/sales/history
      
      return [];
    }

    // -------------------------------------------------------------------------
    // SANDBOX / SIMULATION MODE
    // -------------------------------------------------------------------------
    static async mockHotmartResponse() {
      console.log(`[HotmartService] (Sandbox) Fetching Sales...`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency
  
      const today = new Date().toISOString().split('T')[0];
      
      // Generate 1-3 random sales
      const numberOfSales = Math.floor(Math.random() * 3) + 1;
      const transactions = [];

      for (let i = 0; i < numberOfSales; i++) {
        const randomAmount = (Math.random() * 200 + 47).toFixed(2); // 47-247
        const products = ['Curso Marketing Digital', 'E-book Financeiro', 'Mentoria VIP'];
        const randomProduct = products[Math.floor(Math.random() * products.length)];

        transactions.push({
            description: `Venda Hotmart: ${randomProduct}`,
            amount: parseFloat(randomAmount),
            type: 'income',
            source: 'Hotmart',
            date: today
        });
      }

      return transactions;
    }
  }
  
  module.exports = HotmartService;
