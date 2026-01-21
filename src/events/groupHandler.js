import { monitorarMudancas } from './mainHandler.js';

export const setupGroupEvents = (socket, donoOficial) => {
    socket.ev.on('group-participants.update', async (update) => {
        // Esta linha chama a trava de segurança que fizemos
        await monitorarMudancas(socket, update, donoOficial);
    });
};
