import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function testar() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_test');
    const { version } = await fetchLatestBaileysVersion();
    const socket = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ["Ubuntu", "Chrome", "20.0.04"] });

    if (!socket.authState.creds.registered) {
        const num = await question('Digite seu número com 55: ');
        const code = await socket.requestPairingCode(num);
        console.log('CÓDIGO:', code);
    }

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        console.log("Recebi:", texto); // Ver se aparece no terminal

        if (texto.includes('!jogos')) {
            await socket.sendMessage(msg.key.remoteJid, { text: '✅ O comando funcionou! Agora o problema pode ser sua API KEY.' });
        }
    });
}
testar();
