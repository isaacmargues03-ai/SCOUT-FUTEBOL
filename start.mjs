import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import axios from 'axios';
import readline from 'readline';

const app = express();
app.listen(8080, '0.0.0.0');

const API_KEY = '2b3b43375ff7e80baf7e8f7c45403e06';
const ARQUIVO_DADOS = 'dados.json';

let grupoDestino = '';
let monitorAtivo = false;
let ultimoCanalDetectado = '';

// Carrega as configurações salvas
if (fs.existsSync(ARQUIVO_DADOS)) {
    try {
        const dados = JSON.parse(fs.readFileSync(ARQUIVO_DADOS));
        grupoDestino = dados.grupo || '';
        monitorAtivo = dados.ativo || false;
        ultimoCanalDetectado = dados.canal || '';
    } catch (e) {}
}

async function iniciar() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!state.creds.registered) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const phoneNumber = await new Promise(resolve => rl.question('Digite o número do BOT: ', resolve));
        rl.close();
        setTimeout(async () => {
            const code = await socket.requestPairingCode(phoneNumber);
            console.log(`\n🔗 CÓDIGO DE PAREAMENTO: ${code}\n`);
        }, 5000);
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message) return;

        const jid = msg.key.remoteJid;
        
        let textoOriginal = msg.message.conversation || msg.message.extendedTextMessage?.text || 
                            msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";
        
        // Remove links do texto para o encaminhamento
        const textoLimpo = textoOriginal.replace(/(https?:\/\/[^\s]+)/g, '').trim();
        const comando = textoOriginal.toLowerCase().trim();

        // --- COMANDOS DE CONTROLE ---
        
        // ATIVAR
        if (comando === '.ativar monitor') {
            grupoDestino = jid;
            monitorAtivo = true;
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify({ grupo: jid, ativo: true, canal: ultimoCanalDetectado }));
            await socket.sendMessage(jid, { text: "🔔 *scoutAI:* MONITOR ATIVADO!\nO Sininho está ligado para este grupo." });
            return;
        }

        // DESATIVAR
        if (comando === '.desativar monitor') {
            monitorAtivo = false;
            // Mantém o canal na memória, mas desativa o envio
            fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify({ grupo: '', ativo: false, canal: ultimoCanalDetectado }));
            await socket.sendMessage(jid, { text: "🔕 *scoutAI:* MONITOR DESATIVADO!\nNão enviarei mais postagens até que seja ativado novamente." });
            console.log("🔕 Monitor desligado pelo usuário.");
            return;
        }

        // --- LÓGICA DO CANAL ---
        if (jid.includes('@newsletter')) {
            ultimoCanalDetectado = jid;
            if (monitorAtivo && grupoDestino && textoLimpo.length > 0) {
                try {
                    await socket.sendMessage(grupoDestino, { text: `📢 *NOVA POSTAGEM:*\n\n${textoLimpo}` });
                } catch (e) { console.log("Erro no envio."); }
            }
        }

        // COMANDO .HOJE
        if (comando === '.hoje') {
            try {
                const dataBR = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                const res = await axios.get(`https://v3.football.api-sports.io/fixtures?date=${dataBR}`, {
                    headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' }
                });
                let lista = `📅 *JOGOS DE HOJE (${dataBR.split('-').reverse().join('/')})*\n\n`;
                res.data.response.sort((a,b) => new Date(a.fixture.date) - new Date(b.fixture.date)).forEach(i => {
                    if (!["sub-", "women", "amador", "youth"].some(p => i.league.name.toLowerCase().includes(p))) {
                        const hora = new Date(i.fixture.date).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                        lista += `⏰ ${hora} | ${i.teams.home.name} x ${i.teams.away.name}\n🏆 ${i.league.name}\n---\n`;
                    }
                });
                await socket.sendMessage(jid, { text: lista });
            } catch (e) {}
        }
    });

    socket.ev.on('connection.update', (u) => {
        if (u.connection === 'close') iniciar();
        if (u.connection === 'open') console.log('🚀 scoutAI ONLINE!');
    });
}
iniciar();
