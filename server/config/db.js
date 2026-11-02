import mongoose from 'mongoose';

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
      // Connect directly to external MongoDB (e.g. Atlas)
      const conn = await mongoose.connect(uri);
      console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    }

    // Attempt connecting to local MongoDB first
    try {
      const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/lostlecture', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] Local MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      console.log('[Database] Local MongoDB not detected, initializing in-memory Mongo server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'lostlecture',
        },
      });
      const memUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[Database] MongoDB In-Memory Server Connected: ${memUri}`);
      return conn;
    }
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[Database] Disconnected cleanly');
  } catch (err) {
    console.error('[Database Disconnect Error]', err.message);
  }
};

export default connectDB;
