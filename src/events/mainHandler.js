export const monitorarMudancas = async (socket, update, donoOficial) => {
    const { id, participants, action, author } = update;

    // Se a ação for tirar o ADM (demote)
    if (action === "demote") {
        const alvoId = participants[0];
        const executorId = author;

        // 1. Se quem tirou foi o DONO, o bot não faz nada
        if (!executorId || executorId.includes(donoOficial)) return;

        try {
            // 2. PUNIÇÃO: Tira o ADM de quem tentou tirar o do outro
            await socket.groupParticipantsUpdate(id, [executorId], "demote");

            // 3. RESTAURAÇÃO: Devolve o ADM para a vítima
            await socket.groupParticipantsUpdate(id, [alvoId], "promote");

            // 4. MENSAGEM DE ALERTA
            await socket.sendMessage(id, { 
                text: "🚫 *SEGURANÇA scoutAI FUTEBOL*\n\nTentativa de alteração de cargo não autorizada! O infrator perdeu o ADM e a hierarquia foi restaurada." 
            });
        } catch (err) {
            console.error("Erro na trava de segurança:", err);
        }
    }
};
