import dns from 'dns';
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch (_) {
      // Ignore if DNS server configuration fails on some restricted node runtimes
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('\n🔌 Connexion MongoDB fermée proprement');
  process.exit(0);
});
