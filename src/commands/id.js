export default {
  name: "id",
  handle: async ({ socket, remoteJid }) => {
    await socket.sendMessage(remoteJid, { text: "🆔 *ID DESTE CHAT:*\n\n" + remoteJid });
  },
};
