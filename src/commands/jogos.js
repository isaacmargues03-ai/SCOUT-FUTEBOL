import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  name: "jogos",
  handle: async ({ socket, remoteJid }) => {
    try {
      const { data } = await axios.get('https://www.placardefutebol.com.br/', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $ = cheerio.load(data);
      let mensagem = "🛰️ *scoutAI FUTEBOL - PLACAR REAL* 🛰️\n━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      
      $('.match-card').each((i, el) => {
          const liga = $(el).find('.league-name').text().trim();
          const t1 = $(el).find('.team-home .team-name').text().trim();
          const t2 = $(el).find('.team-away .team-name').text().trim();
          const g1 = $(el).find('.team-home .score').text().trim() || '0';
          const g2 = $(el).find('.team-away .score').text().trim() || '0';
          const status = $(el).find('.status').text().trim();

          if (liga.includes('Carioca') || liga.includes('Champions') || liga.includes('Paulista') || liga.includes('Mineiro')) {
              mensagem += `🏆 *${liga}*\n🕒 ${status} | ${t1} ${g1} x ${g2} ${t2}\n\n`;
          }
      });

      if (mensagem.length < 100) mensagem += "Nenhum jogo importante rolando agora.";
      
      await socket.sendMessage(remoteJid, { text: mensagem });
    } catch (e) {
      await socket.sendMessage(remoteJid, { text: "❌ Erro ao ler placares." });
    }
  }
};
