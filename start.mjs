import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 8000;

// Responde imediatamente para a Koyeb não dar Time-out
app.get('/', (req, res) => res.status(200).send('Bot Online'));
app.listen(PORT, '0.0.0.0', () => console.log(`🛰️ Servidor pronto na porta ${PORT}`));

const SEU_NUMERO = "5521991654183"; 

async function iniciarBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        connectTimeoutMs: 60000, // Aumenta o tempo de espera
        defaultQueryTimeoutMs: 0
    });

    if (!socket.authState.creds.registered) {
        // Gera o código o mais rápido possível
        setTimeout(async () => {
            try {
                const code = await socket.requestPairingCode(SEU_NUMERO);
                console.log(`\n\n*********************************`);
                console.log(`🔗 SEU CÓDIGO DE PAREAMENTO: ${code}`);
                console.log(`*********************************\n\n`);
            } catch (err) {
                console.log("❌ Erro ao gerar código. Tentando novamente...");
                iniciarBot();
            }
        }, 2000);
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'close') iniciarBot();
        if (connection === 'open') console.log('🚀 scoutAI CONECTADO!');
    });

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;
        const jid = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        if (texto.toLowerCase() === '.ativar monitor') {
            await socket.sendMessage(jid, { text: "🔔 Monitor Ativado!" });
        }

        if (jid.includes('@newsletter') && texto.length > 3) {
            // Se houver um grupo salvo, ele encaminha
            console.log("Mensagem recebida do canal!");
        }
    });
}

iniciarBot();
