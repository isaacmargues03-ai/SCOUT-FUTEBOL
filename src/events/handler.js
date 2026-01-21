export const handleParticipantsUpdate = async (update, socket, donoOficial) => {
    // Importa a lógica que criamos
    const antiDemote = await import('./antiDemote.js');
    
    // Executa a verificação
    if (antiDemote.default) {
        await antiDemote.default.handle({ socket, update, donoOficial });
    }
};
