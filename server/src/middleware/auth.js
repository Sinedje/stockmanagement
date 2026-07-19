import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Middleware de protection - vérifie le token JWT
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé — aucun token fourni' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Compte désactivé ou inexistant' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

/**
 * Middleware de contrôle de rôle
 * Usage: authorize('manager', 'ceo')
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Accès refusé. Rôle requis: ${roles.join(' ou ')}`,
    });
  }
  next();
};
