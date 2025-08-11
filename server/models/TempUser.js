import mongoose from 'mongoose';

const tempUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  otp: String,
  lastOtpSentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const TempUser = mongoose.model('TempUser', tempUserSchema);
export default TempUser;
