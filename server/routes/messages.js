const express = require('express');
const router = express.Router();
const chatManager = require('../chatManager');

// Get room info
router.get('/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (!chatManager.roomExists(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const users = chatManager.getRoomUsers(roomId);
  const userCount = chatManager.getRoomUserCount(roomId);

  res.json({
    roomId,
    users,
    userCount,
    active: userCount > 0
  });
});

// Generate a new room ID
router.post('/create-room', (req, res) => {
  const roomId = chatManager.generateRoomId();
  res.json({ roomId });
});

// Check if room exists (useful for validation)
router.get('/room/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  res.json({ 
    exists: chatManager.roomExists(roomId),
    roomId 
  });
});

// Get room statistics
router.get('/room/:roomId/stats', (req, res) => {
  const { roomId } = req.params;
  
  if (!chatManager.roomExists(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    roomId,
    userCount: chatManager.getRoomUserCount(roomId),
    users: chatManager.getRoomUsers(roomId),
    createdAt: new Date().toISOString() // You could track this if needed
  });
});

// Get all active rooms (for debugging/admin purposes)
router.get('/rooms', (req, res) => {
  const rooms = chatManager.getAllRooms();
  res.json({ 
    rooms,
    totalRooms: rooms.length,
    totalUsers: rooms.reduce((sum, room) => sum + room.userCount, 0)
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: chatManager.getAllRooms().length
  });
});

module.exports = router;