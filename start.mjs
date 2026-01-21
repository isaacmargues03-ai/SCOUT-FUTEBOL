import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import fs from 'fs';

// --- SERVIDOR PARA MANTER O BOT VIVO ---
const app = express();
app.get('/', (req, res) => res.send('scoutAI FUTEBOL ONLINE 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Servidor de monitoramento ativo'));

const dbCanais = './grupos_ativos.json';
if (!fs.existsSync(dbCanais)) fs.writeFileSync(dbCanais, JSON.stringify([]));

async function conectarSCOUT() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({ 
        printQRInTerminal: true, 
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const textoRecebido = (msg.message.conversation || 
                               msg.message.extendedTextMessage?.text || "").toLowerCase().trim();

        let gruposAtivos = JSON.parse(fs.readFileSync(dbCanais));

        // Comandos de Grupo
        if (textoRecebido === 'ativar monitor de gols') {
            if (!gruposAtivos.includes(remoteJid)) {
                gruposAtivos.push(remoteJid);
                fs.writeFileSync(dbCanais, JSON.stringify(gruposAtivos));
                await socket.sendMessage(remoteJid, { text: '🚀 *scoutAI FUTEBOL - ATIVADO!*' });
            }
            return;
        }

        if (textoRecebido === 'desativar monitor de gols') {
            gruposAtivos = gruposAtivos.filter(id => id !== remoteJid);
            fs.writeFileSync(dbCanais, JSON.stringify(gruposAtivos));
            await socket.sendMessage(remoteJid, { text: '❌ *scoutAI FUTEBOL - DESATIVADO!*' });
            return;
        }

        // Repasse de Canais
        if (remoteJid.includes('@newsletter')) {
            const textoDoCanal = msg.message.conversation || 
                                 msg.message.extendedTextMessage?.text || 
                                 msg.message.videoMessage?.caption || 
                                 msg.message.imageMessage?.caption || "";

            if (textoDoCanal && gruposAtivos.length > 0) {
                for (const id of gruposAtivos) {
                    try {
                        await new Promise(res => setTimeout(res, 3000)); // Delay anti-ban
                        await socket.sendMessage(id, { text: `⚽ *scoutAI FUTEBOL*\n\n${textoDoCanal}` });
                    } catch (e) {}
                }
            }
        }
    });

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') console.log('✅ BOT CONECTADO E PRONTO PARA HOSPEDAR');
        if (connection === 'close') {
            const deveReconectar = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (deveReconectar) conectarSCOUT();
        }
    });
}
conectarSCOUT();
