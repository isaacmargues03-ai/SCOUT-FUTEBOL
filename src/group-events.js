export const handleGroupUpdate = async (socket, update, donoOficial) => {
    const { id, participants, action, author } = update;

    // Se alguém perdeu o ADM
    if (action === "demote") {
        const alvoId = participants[0];
        const executorId = author;

        // Se quem tirou NÃO foi o dono
        if (executorId && !executorId.includes(donoOficial)) {
            try {
                // 1. Tira o ADM de quem tentou tirar o do outro
                await socket.groupParticipantsUpdate(id, [executorId], "demote");
                // 2. Devolve o ADM para a vítima
                await socket.groupParticipantsUpdate(id, [alvoId], "promote");
                
                await socket.sendMessage(id, { 
                    text: "🚫 *SEGURANÇA scoutAI*\nTentativa de rebaixamento não autorizada. Hierarquia restaurada!" 
                });
            } catch (err) {
                console.log("Erro ao restaurar ADM:", err);
            }
        }
    }
};
