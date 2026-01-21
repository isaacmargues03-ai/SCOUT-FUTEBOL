export const monitorarCargos = async (socket, update, donoOficial) => {
    const { id, participants, action, author } = update;
    if (action === "demote") {
        const alvo = participants[0];
        const executor = author;
        const donoJid = donoOficial.includes('@s.whatsapp.net') ? donoOficial : `${donoOficial}@s.whatsapp.net`;

        if (executor && executor !== donoJid) {
            try {
                await socket.groupParticipantsUpdate(id, [executor], "demote");
                await socket.groupParticipantsUpdate(id, [alvo], "promote");
                await socket.sendMessage(id, { 
                    text: "🚫 *SEGURANÇA scoutAI*\n\nTentativa de rebaixamento não autorizada. O infrator perdeu o cargo e a hierarquia foi restaurada!" 
                });
            } catch (e) { console.log("Erro na trava:", e); }
        }
    }
};
