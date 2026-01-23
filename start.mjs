import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import axios from 'axios';
import readline from 'readline';

const app = express();
const PORT = process.env.PORT || 8000;

// Servidor para a Koyeb saber que o bot está vivo
app.get('/', (req, res) => res.send('scoutAI FUTEBOL ONLINE 🚀'));
app.listen(PORT, '0.0.0.0', () => console.log(`🛰️ Porta monitorada: ${PORT}`));

const API_KEY = '2b3b43375ff7e80baf7e8f7c45403e06';
const ARQUIVO_DADOS = 'dados.json';
let config = { grupo: '', ativo: false, canal: '' };

if (fs.existsSync(ARQUIVO_DADOS)) {
    try { config = JSON.parse(fs.readFileSync(ARQUIVO_DADOS)); } catch (e) {}
}

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true, // Aparecerá no log da Koyeb se precisar
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!state.creds.registered) {
        console.log("⚠️ AGUARDANDO LOGIN...");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const num = await new Promise(res => rl.question('Número do bot (ex: 5521991654183): ', res));
        rl.close();
        setTimeout(async () => {
            try {
                const code = await socket.requestPairingCode(num.replace(/\D/g, ''));
                console.log(`\n✅ SEU CÓDIGO DE PAREAMENTO: ${code}\n`);
            } catch (e) { console.log("Erro ao gerar código."); }
        }, 5000);
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'close') iniciarBot();
        if (u.connection === 'open') console.log('🚀 scoutAI ONLINE NA NUVEM!');
    });

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;
        const jid = msg.key.remoteJid;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || 
                      msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";
        
        const textoLimpo = texto.replace(/(https?:\/\/[^\s]+)/g, '').trim();
        const cmd = texto.toLowerCase().trim();

        if (cmd === '.ativar monitor') {
            config.grupo = jid;
            config.ativo = true;
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(config));
            await socket.sendMessage(jid, { text: "🔔 *scoutAI:* MONITOR ATIVADO!" });
        }

        if (cmd === '.desativar monitor') {
            config.ativo = false;
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(config));
            await socket.sendMessage(jid, { text: "🔕 *scoutAI:* MONITOR DESATIVADO!" });
        }

        // Encaminhamento automático do Canal
        if (jid.includes('@newsletter')) {
            config.canal = jid;
            if (config.ativo && config.grupo && textoLimpo.length > 3) {
                await socket.sendMessage(config.grupo, { text: `📢 *INFO CANAL:*\n\n${textoLimpo}` });
            }
        }
    });
}
iniciarBot();
