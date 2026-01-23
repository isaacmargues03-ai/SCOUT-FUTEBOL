import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import express from 'express';
import fs from 'fs';
import pino from 'pino';

const app = express();
app.get('/', (req, res) => res.send('Monitor Ativo'));
app.listen(process.env.PORT || 8000);

const ARQUIVO_DADOS = 'dados.json';
let config = { grupo: '', ativo: false };

if (fs.existsSync(ARQUIVO_DADOS)) {
    config = JSON.parse(fs.readFileSync(ARQUIVO_DADOS));
}

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // Comando para definir o grupo de destino
        if (texto.toLowerCase() === '.ativar monitor') {
            config.grupo = jid;
            config.ativo = true;
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(config));
            await socket.sendMessage(jid, { text: "✅ *scoutAI:* Este grupo agora receberá as mensagens do canal!" });
            return;
        }

        // Lógica de Encaminhamento: Se a mensagem vier de um CANAL (@newsletter)
        if (jid.includes('@newsletter')) {
            if (config.ativo && config.grupo) {
                console.log("📢 Encaminhando mensagem do canal...");
                // Encaminha o texto para o grupo salvo
                await socket.sendMessage(config.grupo, { text: `📢 *NOVA INFO DO CANAL:*\n\n${texto}` });
            }
        }
    });

    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'close') iniciarBot();
        if (u.connection === 'open') console.log('🚀 Monitor de Canais Rodando!');
    });
}
iniciarBot();
