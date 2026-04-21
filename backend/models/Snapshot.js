const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    savedByUsername: String,
    label: {
      type: String,
      default: 'Auto-save',
    },
    isAutoSave: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Keep max 50 snapshots per room (handled in controller)
snapshotSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Snapshot', snapshotSchema);
