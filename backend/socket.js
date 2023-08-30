import { GPTService } from './services/gptService/gptService.js';

export const handleSocketServer = (socketServer) => {
  socketServer.on('connection', async (socket) => {
    console.log('A user connected');
    const gptService = new GPTService();
    const { chatId, message: initialMessage } = await gptService.createChatPrompt();

    socket.emit('chat-id', chatId);
    socket.emit('response-message', initialMessage);

    socket.on('chat-message', async (message) => {
      gptService.handleSessionMessage(chatId, message,
        (responseMessage) => {
          socket.emit('response-message', responseMessage);
        },
        (relayedMessage) => {
          socket.emit('relayed-request-body', relayedMessage);
        },
      );
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};
