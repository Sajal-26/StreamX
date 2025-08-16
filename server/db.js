import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('MongoDB connection string is missing!');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log('MongoDB connected');
            return mongoose;
        }).catch(err => {
            console.error('MongoDB connection error:', err);
            throw err;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
};