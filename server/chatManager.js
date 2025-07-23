// In-memory room management (no database or persistent storage)
class ChatManager {
  constructor() {
    // rooms structure: { roomId: { users: { socketId: username } } }
    this.rooms = new Map();
  }

  // Add user to a room
  addUserToRoom(roomId, socketId, username) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { users: new Map() });
    }
    
    const room = this.rooms.get(roomId);
    room.users.set(socketId, username);
    
    console.log(`Added ${username} to room ${roomId}`);
  }

  // Remove user from a room
  removeUserFromRoom(roomId, socketId) {
    if (!this.rooms.has(roomId)) {
      return;
    }

    const room = this.rooms.get(roomId);
    const username = room.users.get(socketId);
    room.users.delete(socketId);

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }

    console.log(`Removed ${username} from room ${roomId}`);
  }

  // Get all users in a room
  getRoomUsers(roomId) {
    if (!this.rooms.has(roomId)) {
      return [];
    }

    const room = this.rooms.get(roomId);
    return Array.from(room.users.values());
  }

  // Get user count in a room
  getRoomUserCount(roomId) {
    if (!this.rooms.has(roomId)) {
      return 0;
    }

    return this.rooms.get(roomId).users.size;
  }

  // Check if room exists
  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  // Get all active rooms (for debugging)
  getAllRooms() {
    const roomsList = [];
    for (const [roomId, room] of this.rooms) {
      roomsList.push({
        roomId,
        userCount: room.users.size,
        users: Array.from(room.users.values())
      });
    }
    return roomsList;
  }

  // Generate a random room ID
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

// Export a single instance of ChatManager
const chatManagerInstance = new ChatManager();
module.exports = chatManagerInstance;