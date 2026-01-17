// Service to handle YouTube Analytics API
// Real implementation with Google Cloud OAuth2 Credentials
const { google } = require('googleapis');

class YouTubeService {
    
    /**
     * Fetches AdSense revenue data.
     * @param {string} authTokens - The user's OAuth tokens (access_token, refresh_token)
     */
    static async getChannelRevenue(authTokens = null) {
      // Se não tiver tokens, retorna mock para teste inicial
      if (!authTokens || !authTokens.access_token) {
          console.log('[YouTubeService] Sem tokens OAuth - usando mock para teste');
          return this.mockYouTubeResponse();
      }

      try {
          console.log('[YouTubeService] Buscando dados reais da YouTube API...');
          
          const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
          );

          oauth2Client.setCredentials(authTokens);

          const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
          const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });
          
          // Buscar informações do canal
          const channelResponse = await youtube.channels.list({
            part: 'snippet,statistics',
            mine: true
          });

          if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            throw new Error('Nenhum canal encontrado para este usuário');
          }

          const channel = channelResponse.data.items[0];
          
          // Buscar analytics (últimos 30 dias)
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const analyticsResponse = await youtubeAnalytics.reports.query({
            ids: 'channel==MINE',
            startDate: startDate,
            endDate: endDate,
            metrics: 'estimatedRevenue,views',
            dimensions: 'day',
            sort: 'day'
          });

          const transactions = [];
          
          if (analyticsResponse.data.rows && analyticsResponse.data.rows.length > 0) {
            analyticsResponse.data.rows.forEach(row => {
              const revenue = parseFloat(row[1]) || 0; // estimatedRevenue
              if (revenue > 0) {
                transactions.push({
                  description: `YouTube AdSense - ${channel.snippet.title}`,
                  amount: revenue,
                  type: 'income',
                  source: 'YouTube',
                  date: row[0] // date (YYYY-MM-DD)
                });
              }
            });
          }

          return {
            transactions,
            channelInfo: {
              title: channel.snippet.title,
              subscribers: channel.statistics.subscriberCount,
              totalViews: channel.statistics.viewCount,
              videoCount: channel.statistics.videoCount
            }
          };
          
      } catch (error) {
          console.error('[YouTubeService] Erro ao buscar dados:', error.message);
          
          // Se for erro de autenticação, informar ao usuário
          if (error.code === 401 || error.code === 403) {
            throw new Error('Autenticação expirada. Por favor, reconecte sua conta do YouTube.');
          }
          
          throw error;
      }
    }

    // -------------------------------------------------------------------------
    // SANDBOX / SIMULATION MODE
    // -------------------------------------------------------------------------
    static async mockYouTubeResponse() {
      console.log(`[YouTubeService] (Sandbox) Fetching Analytics...`);
      await new Promise(resolve => setTimeout(resolve, 600));
  
      const today = new Date().toISOString().split('T')[0];
      const randomAmount = (Math.random() * 500 + 100).toFixed(2); // 100-600

      return {
        transactions: [
          {
            description: 'AdSense Earnings (Estimated)',
            amount: parseFloat(randomAmount),
            type: 'income',
            source: 'YouTube',
            date: today
          }
        ]
      };
    }
  }
  
  module.exports = YouTubeService;
