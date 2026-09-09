import User from '../models/User.model.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  const { username, password, name, role, storeId } = req.body;

  try {
    const normalizedUsername = (username || '').toString().trim().toLowerCase();
    const userExists = await User.findOne({ username: normalizedUsername });
    if (userExists) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }

    const newUser = await User.create({
      username: normalizedUsername,
      password,
      name,
      role,
      storeId: storeId || null
    });

    const userResponse = await User.findById(newUser._id).select('-password');
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, role, storeId, password, username } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (storeId !== undefined) user.storeId = storeId || null;

    // Mise à jour du username si fourni et différent
    if (username && username.trim().toLowerCase() !== user.username) {
      const normalizedUsername = username.trim().toLowerCase();
      const exists = await User.findOne({ username: normalizedUsername, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
      }
      user.username = normalizedUsername;
    }

    // Mise à jour du mot de passe uniquement si un nouveau est fourni
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};


export const toggleUserStatus = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    user.isActive = !user.isActive;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};
