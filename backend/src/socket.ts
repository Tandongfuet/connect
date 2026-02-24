
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  try {
    io = new Server(httpServer, {
      cors: {
        origin: '*', // In production, replace with specific frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      // Handle joining a specific user room for private messaging
      socket.on('join_user_room', (userId: string) => {
        if (userId) {
          socket.join(userId);
          console.log(`Socket ${socket.id} joined room ${userId}`);
        }
      });
      
      // Handle joining a specific chat topic (e.g. chat_user1_user2)
      socket.on('join_chat', (topic: string) => {
          if (topic) {
            socket.join(topic);
          }
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  } catch (error) {
    console.error('Failed to initialize Socket.io:', error);
    throw error;
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
