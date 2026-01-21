import { PREFIX } from "../../config.js";
import { isGroup, onlyNumbers } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "rebaixar",
  description: "Rebaixa um administrador para membro comum com trava de segurança",
  commands: ["rebaixar", "rebaixa", "demote"],
  usage: `${PREFIX}rebaixar @usuario`,

  handle: async ({
    args,
    remoteJid,
    socket,
    msg,
    sendWarningReply,
    sendSuccessReply,
    sendErrorReply,
    donoOficial,
  }) => {
    if (!isGroup(remoteJid)) {
      return sendWarningReply("Este comando só pode ser usado em grupo!");
    }

    if (!args.length || !args[0]) {
      return sendWarningReply("Por favor, marque um administrador para rebaixar.");
    }

    const userId = args[0] ? `${onlyNumbers(args[0])}@s.whatsapp.net` : null;
    const autorId = msg.key.participant || msg.key.remoteJid;

    try {
      const groupMetadata = await socket.groupMetadata(remoteJid);
      const participantes = groupMetadata.participants;
      const alvoEhAdm = participantes.find(p => p.id === userId)?.admin !== null;
      const autorEhDono = autorId.includes(donoOficial);

      // A TRAVA: Se o alvo for ADM e quem tenta rebaixar NÃO for o dono
      if (alvoEhAdm && !autorEhDono) {
        await socket.groupParticipantsUpdate(remoteJid, [autorId], "demote");
        return sendErrorReply(
          "🚫 *SEGURANÇA:* Você tentou rebaixar um ADM sem autorização do Dono. Você foi rebaixado!"
        );
      }

      await socket.groupParticipantsUpdate(remoteJid, [userId], "demote");
      await sendSuccessReply("Usuário rebaixado com sucesso!");

    } catch (error) {
      errorLog(`Erro ao rebaixar: ${error.message}`);
      await sendErrorReply("Erro! Verifique se eu sou administrador do grupo.");
    }
  },
};
