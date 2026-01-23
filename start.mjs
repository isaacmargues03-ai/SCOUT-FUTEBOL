import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 8000;
app.get('/', (req, res) => res.send('scoutAI FUTEBOL ATIVO 🚀'));
app.listen(PORT, '0.0.0.0');

// --- NÚMERO ATUALIZADO ---
const SEU_NUMERO = "5521991654183"; 

const ARQUIVO_DADOS = 'dados.json';
let config = { grupo: '', ativo: false, canal: '' };

if (fs.existsSync(ARQUIVO_DADOS)) {
    try { config = JSON.parse(fs.readFileSync(ARQUIVO_DADOS)); } catch (e) {}
}

async function iniciarBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!socket.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await socket.requestPairingCode(SEU_NUMERO);
                console.log(`\n\n---------------------------------`);
                console.log(`🔗 SEU CÓDIGO DE PAREAMENTO: ${code}`);
                console.log(`---------------------------------\n\n`);
            } catch (err) {
                console.log("❌ Erro ao pedir código. Verifique se o WhatsApp está ativo nesse número.");
            }
        }, 5000);
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'close') iniciarBot();
        if (u.connection === 'open') console.log('🚀 scoutAI ONLINE NA KOYEB!');
    });

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const textoLimpo = texto.replace(/(https?:\/\/[^\s]+)/g, '').trim();

        if (texto.toLowerCase() === '.ativar monitor') {
            config.grupo = jid;
            config.ativo = true;
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(config));
            await socket.sendMessage(jid, { text: "🔔 *scoutAI:* MONITOR ATIVADO!" });
        }

        if (jid.includes('@newsletter') && config.ativo && config.grupo && textoLimpo.length > 3) {
            await socket.sendMessage(config.grupo, { text: `📢 *INFO CANAL:*\n\n${textoLimpo}` });
        }
    });
}
iniciarBot();
