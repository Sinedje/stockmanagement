import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// ── Routes ────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import productRoutes from './routes/products.routes.js';
import saleRoutes from './routes/sales.routes.js';
import storeRoutes from './routes/stores.routes.js';
import customerRoutes from './routes/customers.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import breakageRoutes from './routes/breakages.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', productRoutes);       // /api/products + /api/categories
app.use('/api', saleRoutes);          // /api/sales + /api/expenses + /api/versements + /api/cash
app.use('/api', storeRoutes);         // /api/stores + /api/transfers + /api/stock-entries
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', breakageRoutes);      // /api/breakages + /api/repackagings

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 Base de données: ${process.env.MONGODB_URI}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV}\n`);
  });
};

start();
