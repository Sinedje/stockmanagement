/**
 * seed.js — Données initiales pour démarrer le système
 * Usage: npm run seed
 */
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.model.js';
import Store from './models/Store.model.js';
import Category from './models/Category.model.js';
import CompanySettings from './models/CompanySettings.model.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // ── 1. Clean existing data ────────────────────────────────
    await User.deleteMany({});
    await Store.deleteMany({});
    await Category.deleteMany({});
    await CompanySettings.deleteMany({});
    console.log('🗑️  Collections nettoyées');

    // ── 2. Create stores ──────────────────────────────────────
    const [store1, store2] = await Store.create([
      { name: 'Magasin Principal', location: 'Abidjan - Plateau' },
      { name: 'Magasin Secondaire', location: 'Abidjan - Cocody' },
    ]);
    console.log(`🏪 2 magasins créés: ${store1.name}, ${store2.name}`);

    // ── 3. Create default categories ──────────────────────────
    const categories = await Category.create([
      { name: 'Extincteurs' },
      { name: 'Détecteurs' },
      { name: 'Signalisation' },
      { name: 'Accessoires' },
      { name: 'Tuyauterie' },
      { name: 'Équipements' },
    ]);
    console.log(`📂 ${categories.length} catégories créées`);

    // ── 4. Create users ───────────────────────────────────────
    const users = await User.create([
      {
        username: 'admin',
        password: '1234',
        name: 'Administrateur',
        role: 'ceo',
        storeId: store1._id,
      },
      {
        username: 'manager',
        password: '1234',
        name: 'Manager Principal',
        role: 'manager',
        storeId: store1._id,
      },
      {
        username: 'caisse1',
        password: '1234',
        name: 'Caissière Magasin 1',
        role: 'cashier',
        storeId: store1._id,
      },
      {
        username: 'caisse2',
        password: '1234',
        name: 'Caissière Magasin 2',
        role: 'cashier',
        storeId: store2._id,
      },
      {
        username: 'ceo',
        password: '1234',
        name: 'Directeur Général',
        role: 'ceo',
        storeId: null,
      },
      {
        username: 'comptable',
        password: '1234',
        name: 'Comptable',
        role: 'accountant',
        storeId: null,
      },
    ]);
    console.log(`👤 ${users.length} utilisateurs créés (mot de passe: 1234)`);

    // ── 5. Company settings ───────────────────────────────────
    await CompanySettings.create({
      name: 'FEU FLAMENCO',
      activity: 'VENTE DE MATERIELS SECURITE INCENDIE ET ACCESSOIRES',
      phones: '+225 07 48 48 55 90 / +225 05 05 57 26 01',
      ncc: '1947852 B',
      rccm: 'CI-ABJ-03-2019-B13-17654',
    });
    console.log('⚙️  Paramètres entreprise créés');

    console.log('\n✅ Seed terminé avec succès !');
    console.log('────────────────────────────────────');
    console.log('Comptes disponibles (mot de passe: 1234) :');
    console.log('  admin     → Administrateur (PDG)');
    console.log('  manager   → Manager Principal');
    console.log('  caisse1   → Caissière Magasin 1');
    console.log('  caisse2   → Caissière Magasin 2');
    console.log('  ceo       → Directeur Général');
    console.log('  comptable → Comptable');
    console.log('────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de seed:', error.message);
    process.exit(1);
  }
};

seed();
