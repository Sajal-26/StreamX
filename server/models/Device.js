import mongoose from 'mongoose';
import User from './User.js';

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  os: { type: String, required: true },
  browser: { type: String, required: true },
  location: { type: String, required: false },
  lastActive: { type: Date, default: Date.now },
  signedInAt: { type: Date, default: Date.now },
  serverTokenHash: { type: String, required: false },
  refreshTokenHash: { type: String, required: false },
});

deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);

export default Device;