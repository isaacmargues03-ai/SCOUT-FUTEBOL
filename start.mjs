import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import fs from 'fs';
import pino from 'pino';

const app = express();
app.get('/', (req, res) => res.status(200).send('Monitor Ativo'));
app.listen(process.env.PORT || 8000);

const SEU_NUMERO = "5521991654183";
const ARQUIVO_DADOS = 'dados.json';
let config = { grupo: '', ativo: false };

if (fs.existsSync(ARQUIVO_DADOS)) {
    try { config = JSON.parse(fs.readFileSync(ARQUIVO_DADOS)); } catch (e) { config = { grupo: '', ativo: false }; }
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
                console.log(`\n\n🔗 CÓDIGO DE PAREAMENTO: ${code}\n\n`);
            } catch (err) { console.log("Erro ao pedir código."); }
        }, 5000);
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        
        // Captura o texto de várias formas possíveis (conversa direta, legenda de foto ou texto de canal)
        const texto = msg.message.conversation || 
                      msg.message.extendedTextMessage?.text || 
                      msg.message.newsletterMLC?.content || // Novo formato de canal
                      msg.message.imageMessage?.caption || "";

        // COMANDO PARA DEFINIR O GRUPO
        if (texto.toLowerCase().trim() === '.ativar monitor') {
            config.grupo = jid;
            config.ativo = true;
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(config));
            await socket.sendMessage(jid, { text: "✅ *scoutAI:* MONITOR ATIVADO!\nAs mensagens dos canais serão enviadas aqui." });
            return;
        }

        // LÓGICA DE ENCAMINHAMENTO (Se for Newsletter/Canal)
        if (jid.endsWith('@newsletter')) {
            if (config.ativo && config.grupo && texto.length > 2) {
                console.log("📢 Encaminhando do canal para o grupo...");
                await socket.sendMessage(config.grupo, { text: texto });
            }
        }
    });

    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'close') iniciarBot();
        if (u.connection === 'open') console.log('🚀 scoutAI FUTEBOL: MONITORANDO CANAIS!');
    });
}
iniciarBot();
