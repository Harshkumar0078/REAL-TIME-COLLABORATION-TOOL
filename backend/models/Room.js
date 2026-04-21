const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  role: {
    type: String,
    enum: ['owner', 'editor', 'viewer'],
    default: 'editor',
  },
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      default: () => 'SYNC-' + uuidv4().substr(0, 4).toUpperCase(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Session',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      default: 'python',
      enum: ['python', 'javascript', 'cpp', 'java', 'go', 'rust', 'typescript'],
    },
    currentCode: {
      type: String,
      default: '# Start coding here...\n',
    },
    participants: [participantSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model('Room', roomSchema);
