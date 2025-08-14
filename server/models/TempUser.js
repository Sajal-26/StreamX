import mongoose from 'mongoose';

const tempUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // hashed
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  lastOtpSentAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

tempUserSchema.index({ email: 1 });

const TempUser = mongoose.models.TempUser || mongoose.model('TempUser', tempUserSchema);

export default TempUser;
