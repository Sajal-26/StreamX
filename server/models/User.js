// models/User.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  name: { type: String, required: true },
  os: { type: String, required: true },
  browser: { type: String, required: true },
  location: { type: String, required: false },
  lastActive: { type: Date, default: Date.now },
  signedInAt: { type: Date, default: Date.now },
  // serverTokenHash is stored to validate a server-issued token for the device
  serverTokenHash: { type: String, required: false },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'is invalid'], 
    },
    password: {
      type: String,
      required: false
    },
    picture: {
      type: String,
      default: 'https://occ-0-4995-2164.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABW7Wui3ZqHqBvl3R__TmY0sDZF-xBxJJinhVWRwu7OmYkF2bdwH4nqfnyT3YQ-JshQvap33bDbRLACSoadpKwbIQIBktdtHjxw.png?r=201'
    },
    dob: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },

    devices: [deviceSchema],

    // password reset fields
    passwordResetTokenHash: { type: String },
    passwordResetExpires: { type: Date },

    // refresh token storage (store hash, not raw token)
    refreshTokenHash: { type: String },

  },
  {
    timestamps: true,
  }
);

// Index to make deviceId lookups fast
userSchema.index({ 'devices.deviceId': 1 });

// helper to set device server token hash
userSchema.methods.setDeviceServerTokenHash = function (deviceId, token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const device = this.devices.find(d => d.deviceId === deviceId);
  if (device) device.serverTokenHash = hash;
};

// helper to validate a device server token
userSchema.methods.validateDeviceServerToken = function (deviceId, token) {
  const device = this.devices.find(d => d.deviceId === deviceId);
  if (!device || !device.serverTokenHash) return false;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return hash === device.serverTokenHash;
};

// helper to set password with bcrypt
userSchema.methods.setPassword = async function (plain) {
  this.password = await bcrypt.hash(plain, 10);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
