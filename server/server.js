const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const chatManager = require('./chatManager');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', messagesRouter);

// Serve client.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'client.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', (data) => {
    const { roomId, username } = data;
    
    if (!roomId || !username) {
      socket.emit('error', { message: 'Room ID and username are required' });
      return;
    }

    // Leave any previous rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomId);
    socket.username = username;
    socket.currentRoom = roomId;

    // Add user to room management
    chatManager.addUserToRoom(roomId, socket.id, username);

    // Notify user they joined successfully
    socket.emit('joined-room', { 
      roomId, 
      username,
      users: chatManager.getRoomUsers(roomId)
    });

    // Notify other users in the room
    socket.to(roomId).emit('user-joined', { 
      username, 
      users: chatManager.getRoomUsers(roomId)
    });

    console.log(`${username} joined room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    const { message } = data;
    const roomId = socket.currentRoom;
    const username = socket.username;

    if (!roomId || !username) {
      socket.emit('error', { message: 'You must join a room first' });
      return;
    }

    if (!message || message.trim() === '') {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    const messageData = {
      id: Date.now() + Math.random(),
      username,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      socketId: socket.id
    };

    // Send message to all users in the room
    io.to(roomId).emit('new-message', messageData);

    console.log(`Message in room ${roomId} from ${username}: ${message}`);
  });

  // Handle typing indicators
  socket.on('typing', () => {
    if (socket.currentRoom && socket.username) {
      socket.to(socket.currentRoom).emit('user-typing', { 
        username: socket.username 
      });
    }
  });

  socket.on('stop-typing', () => {
    if (socket.currentRoom && socket.username) {
      socket.to(socket.currentRoom).emit('user-stop-typing', { 
        username: socket.username 
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.currentRoom && socket.username) {
      // Remove user from room management
      chatManager.removeUserFromRoom(socket.currentRoom, socket.id);
      
      // Notify other users in the room
      socket.to(socket.currentRoom).emit('user-left', { 
        username: socket.username,
        users: chatManager.getRoomUsers(socket.currentRoom)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});