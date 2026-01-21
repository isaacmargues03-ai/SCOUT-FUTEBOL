export default {
  name: "anti-demote-nativo",
  handle: async ({ socket, update, donoOficial }) => {
    const { id, participants, action, author } = update;

    // Detecta quando alguém tira o ADM (demote) manualmente
    if (action === "demote") {
      const alvoId = participants[0]; // Quem perdeu o ADM
      const executorId = author;      // Quem tirou o ADM

      // Se quem tirou NÃO for o dono do Bot, a trava dispara
      if (executorId && !executorId.includes(donoOficial)) {
        try {
          // 1. PUNIÇÃO: Tira o ADM de quem tentou tirar o do outro
          await socket.groupParticipantsUpdate(id, [executorId], "demote");

          // 2. RESTAURAÇÃO: Devolve o ADM para a vítima
          await socket.groupParticipantsUpdate(id, [alvoId], "promote");

          // 3. AVISO
          await socket.sendMessage(id, { 
            text: `🚫 *CONTRA-ATAQUE scoutAI*\n\nO usuário @${executorId.split('@')[0]} tentou mexer na hierarquia sem autorização. Ele perdeu o cargo e o ADM do colega foi restaurado.`,
            mentions: [executorId, alvoId]
          });
        } catch (err) {
          console.error("Erro na trava de segurança:", err);
        }
      }
    }
  }
};
