import axios from 'axios';
import * as cheerio from 'cheerio';

let ultimoPlacar = "";

export const verificarGolsWeb = async (socket, grupoId) => {
    try {
        const { data } = await axios.get('https://www.placardefutebol.com.br/jogos-de-hoje');
        const $ = cheerio.load(data);
        const jogoTexto = $('.match-card').first().text().replace(/\s+/g, ' ').trim();

        if (jogoTexto && jogoTexto !== ultimoPlacar) {
            ultimoPlacar = jogoTexto;
            await socket.sendMessage(grupoId, { 
                text: `⚽ *scoutAI FUTEBOL - GOL/NOTÍCIA*\n\n${jogoTexto}\n\n_Atualização Automática_` 
            });
        }
    } catch (e) {}
};
