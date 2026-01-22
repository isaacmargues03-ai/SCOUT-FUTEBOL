import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import axios from 'axios';

const app = express();
// O WispByte fornece a porta automaticamente aqui:
const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('scoutAI FUTEBOL ONLINE'));
app.listen(port, '0.0.0.0', () => console.log(`Servidor ativo na porta ${port}`));

const API_KEY = '2b3b43375ff7e80baf7e8f7c45403e06';
let GRUPO_DESTINO = '120363424026290830@g.us'; 
const CANAL_ORIGEM = '120363391746244585@newsletter'; 
let monitorAtivo = true; 
let golsRegistrados = new Set(); 

async function conectar() {
    // No WispByte, a pasta auth_info será salva no disco do servidor
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({
        auth: state,
        printQRInTerminal: true, // O QR Code aparecerá no Console do WispByte
        browser: ["scoutAI FUTEBOL", "Chrome", "1.0.0"],
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message) return;
        const jid = msg.key.remoteJid;

        // Retransmissão do Canal
        if (jid === CANAL_ORIGEM) {
            const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (texto) await socket.sendMessage(GRUPO_DESTINO, { text: texto });
        }
    });

    // Loop de Gols Profissionais
    setInterval(async () => {
        try {
            const res = await axios.get(`https://v3.football.api-sports.io/fixtures?live=all`, {
                headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
            });
            for (const j of res.data.response) {
                const idGol = `${j.fixture.id}-${j.goals.home}-${j.goals.away}`;
                if (!golsRegistrados.has(idGol)) {
                    const msg = `⚽ *GOL!* ${j.teams.home.name} ${j.goals.home} x ${j.goals.away} ${j.teams.away.name}`;
                    await socket.sendMessage(GRUPO_DESTINO, { text: msg });
                    golsRegistrados.add(idGol);
                }
            }
        } catch (e) {}
    }, 30000);

    socket.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') console.log('✅ scoutAI ONLINE NO WISPBYTE!');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) conectar();
        }
    });
}
conectar();
