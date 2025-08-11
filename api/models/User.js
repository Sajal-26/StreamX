import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'is invalid'], 
    },
    password: {
      type: String,
      required: false
    },
    picture: String,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;