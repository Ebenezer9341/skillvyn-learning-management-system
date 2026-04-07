// ✅ AFTER
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';

const PORT = process.env.PORT || 8080;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:5173'],
        credentials: true
    }
});

// Each user joins their own private room using their userId
// so we can target notifications to specific users
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(userId);
    });

    socket.on('disconnect', () => {});
});

export { io };

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});