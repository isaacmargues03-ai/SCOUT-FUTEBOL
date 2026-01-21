import axios from 'axios';
import * as cheerio from 'cheerio';

let placaresAnteriores = {};

export const verificarGols = (socket, gruposIds) => {
    console.log("📡 Monitor scoutAI FUTEBOL iniciado...");

    setInterval(async () => {
        if (gruposIds.size === 0) return;
        
        try {
            // Buscamos os dados com um cabeçalho que simula um navegador real
            const { data } = await axios.get('https://www.placardefutebol.com.br/', {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'pt-BR,pt;q=0.9'
                }
            });
            const $ = cheerio.load(data);
            
            $('.match-card').each((i, el) => {
                const liga = $(el).find('.league-name').text().trim() || "Liga Desconhecida";
                const timeCasa = $(el).find('.team-home .team-name').text().trim();
                const timeFora = $(el).find('.team-away .team-name').text().trim();
                const golsCasa = $(el).find('.team-home .score').text().trim();
                const golsFora = $(el).find('.team-away .score').text().trim();
                const status = $(el).find('.status').text().trim();

                if (timeCasa && timeFora) {
                    const idJogo = `${timeCasa}x${timeFora}`.replace(/\s+/g, '');
                    const placarAtual = `${golsCasa}-${golsFora}`;

                    // Lógica de Detecção de Gol:
                    // 1. Já temos o jogo na memória?
                    // 2. O placar mudou?
                    // 3. O jogo não está no "Pré-jogo"?
                    if (placaresAnteriores[idJogo] !== undefined) {
                        if (placaresAnteriores[idJogo] !== placarAtual) {
                            
                            const mensagem = `⚽ *_GOOOOL DA CHAMPIONS!_* ⚽\n\n` +
                                           `⚔️ *${timeCasa} ${golsCasa} X ${golsFora} ${timeFora}*\n` +
                                           `🏆 _${liga}_\n` +
                                           `⏱️ _Status: ${status}_`;
                            
                            gruposIds.forEach(id => {
                                socket.sendMessage(id, { text: mensagem });
                            });
                            console.log(`[GOL] ${timeCasa} ${golsCasa}x${golsFora} ${timeFora}`);
                        }
                    }

                    // Salva/Atualiza o placar atual para a próxima checagem
                    placaresAnteriores[idJogo] = placarAtual;
                }
            });
        } catch (error) {
            console.log("⚠️ Erro na sincronização:", error.message);
        }
    }, 20000); // Checagem ultra-rápida a cada 20 segundos
};
