import { Server } from 'socket.io';

let io;

export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
      ],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-project', (projectId) => socket.join(`project:${projectId}`));
    socket.on('leave-project', (projectId) => socket.leave(`project:${projectId}`));
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    // Return a dummy object for serverless environments (Vercel)
    return {
      emit: () => {},
      to: () => ({ emit: () => {} }),
    };
  }
  return io;
};
