const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Snapshot = require('../models/Snapshot');

// Track active rooms: roomId -> { users: Map<socketId, userInfo> }
const activeRooms = new Map();

// Authenticate socket connection via JWT
const authenticateSocket = (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    // Allow guest with username only
    socket.user = { username: socket.handshake.auth?.username || 'Guest', isGuest: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
};

const initSocket = (io) => {
  // Apply auth middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.user?.username || 'unknown'})`);

    // ── JOIN ROOM ──────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId, username }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.username = username || socket.user?.username || 'Guest';

        // Track in memory
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, { users: new Map() });
        }
        activeRooms.get(roomId).users.set(socket.id, {
          socketId: socket.id,
          username: socket.username,
          userId: socket.user?.id,
          color: generateUserColor(socket.id),
          cursor: null,
        });

        // Send current code state to the joining user
        socket.emit('room-joined', {
          roomId,
          currentCode: room.currentCode,
          language: room.language,
          users: getUserList(roomId),
        });

        // Notify others
        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          username: socket.username,
          color: activeRooms.get(roomId).users.get(socket.id).color,
          users: getUserList(roomId),
        });

        console.log(`👥 ${socket.username} joined room ${roomId}`);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── CODE CHANGE ────────────────────────────────────────────────
    socket.on('code-change', ({ roomId, code, delta }) => {
      // Broadcast to all OTHER users in the room
      socket.to(roomId).emit('code-update', {
        code,
        delta,
        socketId: socket.id,
        username: socket.username,
      });

      // Debounced auto-save to DB (every 10 seconds of activity)
      scheduleAutoSave(roomId, code, socket);
    });

    // ── CURSOR POSITION ────────────────────────────────────────────
    socket.on('cursor-move', ({ roomId, position, selection }) => {
      const roomData = activeRooms.get(roomId);
      if (roomData?.users.has(socket.id)) {
        roomData.users.get(socket.id).cursor = position;
      }

      socket.to(roomId).emit('cursor-update', {
        socketId: socket.id,
        username: socket.username,
        color: roomData?.users.get(socket.id)?.color,
        position,
        selection,
      });
    });

    // ── LANGUAGE CHANGE ────────────────────────────────────────────
    socket.on('language-change', async ({ roomId, language }) => {
      try {
        await Room.findOneAndUpdate({ roomId }, { language });
        io.to(roomId).emit('language-updated', {
          language,
          changedBy: socket.username,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── CHAT MESSAGE ───────────────────────────────────────────────
    socket.on('chat-message', ({ roomId, message }) => {
      if (!message?.trim()) return;

      const chatData = {
        id: Date.now().toString(),
        socketId: socket.id,
        username: socket.username,
        message: message.trim().substring(0, 500), // limit length
        timestamp: new Date().toISOString(),
        color: activeRooms.get(roomId)?.users.get(socket.id)?.color,
      };

      io.to(roomId).emit('chat-message', chatData);
    });

    // ── SAVE SNAPSHOT ──────────────────────────────────────────────
    socket.on('save-snapshot', async ({ roomId, code, label }) => {
      try {
        const room = await Room.findOneAndUpdate(
          { roomId },
          { currentCode: code },
          { new: true }
        );

        const snapshot = await Snapshot.create({
          room: room._id,
          roomId,
          code,
          language: room.language,
          savedByUsername: socket.username,
          label: label || 'Manual save',
          isAutoSave: false,
        });

        io.to(roomId).emit('snapshot-saved', {
          snapshot: {
            id: snapshot._id,
            label: snapshot.label,
            savedByUsername: snapshot.savedByUsername,
            createdAt: snapshot.createdAt,
          },
          savedBy: socket.username,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── RESTORE SNAPSHOT ───────────────────────────────────────────
    socket.on('restore-snapshot', async ({ roomId, snapshotId }) => {
      try {
        const snapshot = await Snapshot.findById(snapshotId);
        if (!snapshot) {
          socket.emit('error', { message: 'Snapshot not found' });
          return;
        }

        await Room.findOneAndUpdate({ roomId }, { currentCode: snapshot.code });

        io.to(roomId).emit('code-restored', {
          code: snapshot.code,
          label: snapshot.label,
          restoredBy: socket.username,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── CODE EXECUTION RESULT broadcast ───────────────────────────
    socket.on('execution-result', ({ roomId, result }) => {
      // Broadcast execution output to all users in room
      socket.to(roomId).emit('execution-result', {
        result,
        executedBy: socket.username,
      });
    });

    // ── TYPING INDICATOR ───────────────────────────────────────────
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { username: socket.username });
    });

    // ── LEAVE ROOM ─────────────────────────────────────────────────
    socket.on('leave-room', ({ roomId }) => {
      handleLeave(socket, roomId, io);
    });

    // ── DISCONNECT ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        handleLeave(socket, socket.currentRoom, io);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

// ── Helpers ───────────────────────────────────────────────────────

const handleLeave = (socket, roomId, io) => {
  socket.leave(roomId);
  const roomData = activeRooms.get(roomId);
  if (roomData) {
    roomData.users.delete(socket.id);
    if (roomData.users.size === 0) {
      activeRooms.delete(roomId);
    }
  }

  io.to(roomId).emit('user-left', {
    socketId: socket.id,
    username: socket.username,
    users: getUserList(roomId),
  });
};

const getUserList = (roomId) => {
  const roomData = activeRooms.get(roomId);
  if (!roomData) return [];
  return Array.from(roomData.users.values());
};

const generateUserColor = (socketId) => {
  const colors = [
    '#7c6dfa', '#2dd4bf', '#f472b6', '#fbbf24',
    '#60a5fa', '#34d399', '#f87171', '#a78bfa',
  ];
  const index = socketId.charCodeAt(0) % colors.length;
  return colors[index];
};

// Auto-save debounce per room
const autoSaveTimers = new Map();

const scheduleAutoSave = (roomId, code, socket) => {
  if (autoSaveTimers.has(roomId)) {
    clearTimeout(autoSaveTimers.get(roomId));
  }
  const timer = setTimeout(async () => {
    try {
      await Room.findOneAndUpdate({ roomId }, { currentCode: code });
      const room = await Room.findOne({ roomId });
      if (room) {
        await Snapshot.create({
          room: room._id,
          roomId,
          code,
          language: room.language,
          savedByUsername: socket.username,
          label: 'Auto-save',
          isAutoSave: true,
        });
      }
    } catch (err) {
      console.error('Auto-save error:', err.message);
    }
    autoSaveTimers.delete(roomId);
  }, 10000); // 10 second debounce

  autoSaveTimers.set(roomId, timer);
};

module.exports = { initSocket };
