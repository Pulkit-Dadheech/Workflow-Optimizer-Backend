import { connect } from 'mongoose';

const connectDB = async () => {
  try {
    const response = await connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
