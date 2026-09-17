const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nurselearn';
    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
