import { getPermissao } from '../lib/auth.js'; // Supondo que você tenha um loader de permissões

export default {
  name: "ban",
  handle: async ({ socket, remoteJid, msg, texto, donoOficial }) => {
    try {
      // 1. Identifica quem enviou o comando e quem é o alvo
      const autorId = msg.key.participant || msg.key.remoteJid;
      const mencionado = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      
      if (!mencionado) return socket.sendMessage(remoteJid, { text: "❌ Marque alguém para banir." });

      // 2. BUSCA NÍVEIS DE PERMISSÃO (Simulação de Hierarquia)
      // Aqui você checa se o ID é o seu (Dono) ou se está na lista de ADMs
      const ehDono = autorId.includes(donoOficial) || autorId.includes("SEU_NUMERO_AQUI");
      const alvoEhAdm = (await socket.groupMetadata(remoteJid)).participants
                        .find(p => p.id === mencionado)?.admin !== null;

      // 3. TRAVA DE SEGURANÇA: O "ANTI-BAN"
      if (alvoEhAdm) {
        if (!ehDono) {
          return socket.sendMessage(remoteJid, { 
            text: "🚫 *SISTEMA DE SEGURANÇA scoutAI*\n\nUm Administrador não pode banir outro. Apenas o *Dono do Robô* tem essa autoridade." 
          });
        }
      }

      // 4. Executa o banimento se passar na trava
      await socket.groupParticipantsUpdate(remoteJid, [mencionado], "remove");
      await socket.sendMessage(remoteJid, { text: "✅ Usuário removido com sucesso." });

    } catch (error) {
      console.error(error);
      await socket.sendMessage(remoteJid, { text: "❌ Erro ao executar comando de ban." });
    }
  }
};
