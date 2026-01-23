import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';

const app = express();
const PORT = process.env.PORT || 8000;
app.get('/', (req, res) => res.status(200).send('BOT_OK'));
app.listen(PORT, '0.0.0.0');

const SEU_NUMERO = "5521991654183"; 

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
    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'close') iniciarBot();
        if (u.connection === 'open') console.log('🚀 scoutAI CONECTADO COM SUCESSO!');
    });
}
iniciarBot();
