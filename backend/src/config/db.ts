import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not exit the process in development; allow the server to run without DB
    // so frontend and other non-DB features can be tested. In production, fail fast.
    if (process.env.NODE_ENV === 'production') {
      (process as any).exit(1);
    }
  }
};

export default connectDB;