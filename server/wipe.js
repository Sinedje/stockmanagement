import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import mongoose from 'mongoose';

const wipeDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB pour réinitialisation complète');
    
    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Base de données entièrement effacée !');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

wipeDB();
