import axios from 'axios';

export default {
  name: "escalacao",
  handle: async ({ socket, remoteJid, texto }) => {
    try {
      const termoBusca = texto.replace('.escalacao', '').trim().toLowerCase() || "bayern";
      
      const { data: busca } = await axios.get(`https://www.sofascore.com/api/v1/search/all?q=${termoBusca}&limit=1`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const timeId = busca.results[0]?.entity?.id;
      if (!timeId) return socket.sendMessage(remoteJid, { text: "❌ Time não encontrado." });

      const { data: eventos } = await axios.get(`https://www.sofascore.com/api/v1/team/${timeId}/events/next/0`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const jogo = eventos.events[0];
      if (!jogo) return socket.sendMessage(remoteJid, { text: "❌ Nenhum jogo próximo encontrado." });

      const { data: lineupData } = await axios.get(`https://www.sofascore.com/api/v1/event/${jogo.id}/lineups`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const ehOficial = lineupData.confirmed;
      const titulo = ehOficial ? "✅ ESCALAÇÃO OFICIAL" : "📝 PROVÁVEL ESCALAÇÃO";
      
      let msg = `🛰️ *scoutAI FUTEBOL* 🛰️\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*${titulo} ${termoBusca.toUpperCase()}*\n`;
      msg += `🏟️ _${jogo.homeTeam.name} x ${jogo.awayTeam.name}_\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const formatarTime = (nome, jogadores) => {
          let str = `🛡️ *${nome.toUpperCase()}*\n`;
          if (!jogadores || jogadores.length === 0) return str + "_Ainda não disponível_\n";
          jogadores.forEach(p => {
              str += `• ${p.player.shortName || p.player.name}\n`;
          });
          return str;
      };

      // Exibe um time, pula linha, e exibe o outro
      msg += formatarTime(jogo.homeTeam.name, lineupData.home?.players);
      msg += `\n───────────────────────\n\n`;
      msg += formatarTime(jogo.awayTeam.name, lineupData.away?.players);

      await socket.sendMessage(remoteJid, { text: msg });

    } catch (e) {
      await socket.sendMessage(remoteJid, { text: "⚠️ Dados indisponíveis para este jogo no momento." });
    }
  }
};
