import axios from 'axios';

export const iniciarMonitor = (socket, gruposIds) => {
    console.log("🛰️ SISTEMA SCOUT: Monitor de Gols Ativado!");

    // O bot vai checar a cada 60 segundos
    setInterval(async () => {
        try {
            // Simulando a detecção de um gol pela API
            // Quando você tiver a API, aqui faremos a comparação de placar
            
            const golDetectado = false; // Isso vira 'true' quando a API avisa o gol

            if (golDetectado) {
                const avisoGol = 
                    "🚨 *GOL CONFIRMADO - SCOUT FUTEBOL* 🚨\n" +
                    "━━━━━━━━━━━━━━━━━━━━\n\n" +
                    "⚽ *GOL DO TIME!* \n" +
                    "🏟️ Placar: Time A 1 🆚 0 Time B\n" +
                    "👤 Autor: Craque do Jogo\n" +
                    "⏱️ Minuto: 42'\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━\n" +
                    "📈 _Monitoramento Automático SCOUT_";

                // Envia para todos os grupos cadastrados
                for (const id of gruposIds) {
                    await socket.sendMessage(id, { text: avisoGol });
                }
            }
        } catch (error) {
            console.error("Erro no monitor de gols:", error);
        }
    }, 60000); 
};
