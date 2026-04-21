const Room = require('../models/Room');
const Snapshot = require('../models/Snapshot');

// POST /api/rooms/create
const createRoom = async (req, res) => {
  try {
    const { name, language } = req.body;

    const room = await Room.create({
      name: name || 'Untitled Session',
      language: language || 'python',
      owner: req.user._id,
      participants: [
        {
          user: req.user._id,
          username: req.user.username,
          role: 'owner',
        },
      ],
    });

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/rooms/:roomId
const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('owner', 'username')
      .populate('participants.user', 'username');

    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (!room.isActive) return res.status(410).json({ error: 'Room is closed.' });

    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/rooms/:roomId/join
const joinRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (!room.isActive) return res.status(410).json({ error: 'Room is closed.' });

    const alreadyIn = room.participants.find(
      (p) => p.user?.toString() === req.user._id.toString()
    );

    if (!alreadyIn) {
      room.participants.push({
        user: req.user._id,
        username: req.user.username,
        role: 'editor',
      });
      await room.save();
    }

    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/rooms/:roomId/code  — save current code
const saveCode = async (req, res) => {
  try {
    const { code, isAutoSave, label } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    // Update current code in room
    room.currentCode = code;
    await room.save();

    // Create snapshot
    const snapshot = await Snapshot.create({
      room: room._id,
      roomId: room.roomId,
      code,
      language: room.language,
      savedBy: req.user._id,
      savedByUsername: req.user.username,
      label: label || (isAutoSave ? 'Auto-save' : 'Manual save'),
      isAutoSave: !!isAutoSave,
    });

    // Keep only latest 50 snapshots per room
    const snapshots = await Snapshot.find({ room: room._id })
      .sort({ createdAt: -1 })
      .skip(50);
    if (snapshots.length > 0) {
      await Snapshot.deleteMany({ _id: { $in: snapshots.map((s) => s._id) } });
    }

    res.json({ snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/rooms/:roomId/snapshots
const getSnapshots = async (req, res) => {
  try {
    const snapshots = await Snapshot.find({ roomId: req.params.roomId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    res.json({ snapshots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/rooms/:roomId/snapshots/:snapshotId — restore
const getSnapshot = async (req, res) => {
  try {
    const snapshot = await Snapshot.findById(req.params.snapshotId);
    if (!snapshot) return res.status(404).json({ error: 'Snapshot not found.' });
    res.json({ snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/rooms/:roomId/participants/:userId/role
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    // Only owner can change roles
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can change roles.' });
    }

    const participant = room.participants.find(
      (p) => p.user?.toString() === req.params.userId
    );
    if (!participant) return res.status(404).json({ error: 'Participant not found.' });

    participant.role = role;
    await room.save();

    res.json({ message: 'Role updated.', room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/rooms/:roomId  — close room
const closeRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can close the room.' });
    }

    room.isActive = false;
    await room.save();

    res.json({ message: 'Room closed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  saveCode,
  getSnapshots,
  getSnapshot,
  updateRole,
  closeRoom,
};
