const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRoom,
  joinRoom,
  saveCode,
  getSnapshots,
  getSnapshot,
  updateRole,
  closeRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.post('/create', protect, createRoom);
router.get('/:roomId', protect, getRoom);
router.post('/:roomId/join', protect, joinRoom);
router.put('/:roomId/code', protect, saveCode);
router.get('/:roomId/snapshots', protect, getSnapshots);
router.get('/:roomId/snapshots/:snapshotId', protect, getSnapshot);
router.put('/:roomId/participants/:userId/role', protect, updateRole);
router.delete('/:roomId', protect, closeRoom);

module.exports = router;
