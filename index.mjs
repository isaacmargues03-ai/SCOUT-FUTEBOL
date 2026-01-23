import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import axios from 'axios';
import pino from 'pino';

const app = express();
app.listen(8080, '0.0.0.0');

const GRUPO_DESTINO = '120363424026290830@g.us'; 
const CANAIS_ORIGEM = ['120363391746244585@newsletter', '120363294344158485@newsletter'];

let monitorAtivo = false; // Controle do monitor

async function conectar() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;
        
        const jid = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // COMANDO PARA ATIVAR MONITOR
        if (texto.toLowerCase() === '.ativar monitor') {
            monitorAtivo = true;
            await socket.sendMessage(jid, { text: "✅ *Monitor de Jogos ATIVADO!*" });
            return;
        }

        if (texto.toLowerCase() === '.desativar monitor') {
            monitorAtivo = false;
            await socket.sendMessage(jid, { text: "❌ *Monitor de Jogos DESATIVADO!*" });
            return;
        }

        // ENCAMINHAMENTO DE CANAIS (Só funciona se monitor estiver ativo)
        if (monitorAtivo && CANAIS_ORIGEM.includes(jid)) {
            await socket.sendMessage(GRUPO_DESTINO, { text: `📢 *NOVIDADE:* \n\n${texto}` });
        }
    });

    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log('🚀 scoutAI FUTEBOL CONECTADO!');
        if (u.connection === 'close') conectar();
    });
}
conectar();
