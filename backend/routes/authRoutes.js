const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate, adminOnly, getJwtSecret } = require('../middleware/auth');
const { requireAuthPermission, blockClientRole, hasAnyPermission } = require('../middleware/authPermissions');
const { getDefaultAvatar } = require('../utils/avatar');
const { getDefaultEmployeePassword } = require('../utils/passwords');
const { sendPasswordResetEmail } = require('../utils/mail');

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  designation: user.designation || '',
  bio: user.bio || '',
  skills: user.skills || [],
  cover: user.cover || '',
  permissions: user.permissions || [],
  website: user.website || '',
  technologies: user.technologies || '',
  projectName: user.projectName || '',
});

// --- LOGIN (public) ---
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = req.body?.password;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing credentials. Email and password are required.' });
    }

    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ email: { $regex: new RegExp('^' + escaped + '$', 'i') } });
    if (!user) {
      return res.status(404).json({
        message: 'User not found. On a new PC run: cd backend && npm run seed (MongoDB must be running).',
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '1d' });
    res.json({ token, user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- REGISTER CLIENT (admin or staff with client management access) ---
router.post(
  '/register',
  authenticate,
  blockClientRole,
  requireAuthPermission('mgmt-clients', 'mgmt-clients-list', 'mgmt-add-client'),
  async (req, res) => {
  try {
    const { name, email, phone, password, website, technologies, projectName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({
      name,
      email,
      phone,
      password,
      role: 'client',
      avatar: getDefaultAvatar(name),
      website: website || '',
      technologies: technologies || '',
      projectName: projectName || '',
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name,
        email,
        role: 'client',
        website: newUser.website,
        technologies: newUser.technologies,
        projectName: newUser.projectName,
      },
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: err.message });
  }
});

const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const cors = process.env.CORS_ORIGIN || '';
  const first = cors.split(',')[0]?.trim();
  return first || 'http://localhost:5173';
};

// --- FORGOT PASSWORD (public) ---
router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    const message =
      'If an account exists with that email, you will receive password reset instructions shortly.';

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = `${getFrontendUrl()}/auth/new-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    res.json({ message });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// --- RESET PASSWORD WITH TOKEN (public) ---
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.use(authenticate);

// --- GET ALL CLIENTS (admin or staff with client/invoice/project access) ---
router.get(
  '/clients',
  blockClientRole,
  requireAuthPermission(
    'mgmt-clients',
    'mgmt-clients-list',
    'mgmt-add-client',
    'mgmt-invoices',
    'mgmt-projects',
    'mgmt-kanban'
  ),
  async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password');
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATE PROFILE ---
router.put('/update-profile', async (req, res) => {
  try {
    const { id, name, email, phone, designation, bio, skills, avatar, cover } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (designation !== undefined) user.designation = designation;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (avatar !== undefined) user.avatar = avatar;
    if (cover !== undefined) user.cover = cover;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CHANGE PASSWORD ---
router.post('/change-password', async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// --- ADMIN RESET PASSWORD ---
router.post('/admin/reset-password', adminOnly, async (req, res) => {
  try {
    const { userId, email } = req.body;
    let user;

    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      return res.status(400).json({ message: 'userId or email is required' });
    }

    const defaultPassword = getDefaultEmployeePassword();

    if (!user) {
      const { Employee } = require('../models/ERPModels');
      const employee = await Employee.findOne({ email: email?.toLowerCase() });
      if (!employee) {
        return res.status(404).json({ message: 'Employee profile not found in database' });
      }

      user = new User({
        name: employee.name,
        email: employee.email.toLowerCase(),
        phone: employee.phone || '',
        password: defaultPassword,
        role: 'employee',
        designation: employee.designation || '',
        avatar: employee.avatar || getDefaultAvatar(employee.name),
      });
      await user.save();
    } else {
      user.password = defaultPassword;
      await user.save();
    }

    res.json({ message: `Password reset successfully for ${user.name}. Share the new credentials securely.` });
  } catch (err) {
    console.error('Admin Reset Password Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// --- GET SINGLE USER ---
router.get('/profile/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET ALL USERS ---
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATE USER PERMISSIONS ---
router.put('/users/:id/permissions', adminOnly, async (req, res) => {
  try {
    const { permissions } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.permissions = permissions;
    await user.save();

    res.json({
      message: 'Permissions updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- EDIT/UPDATE USER (admin, or staff with client-management access editing a client) ---
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const canManageClients = hasAnyPermission(req.user, ['mgmt-clients', 'mgmt-clients-list', 'mgmt-add-client']);
      if (!canManageClients || user.role !== 'client') {
        return res.status(403).json({ message: 'Insufficient permissions for this action' });
      }
    }

    const { name, email, phone, role, website, technologies, projectName } = req.body;

    const allowedRoles = ['admin', 'client', 'employee'];
    if (role !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only admins can change user roles' });
      }
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (website !== undefined) user.website = website;
    if (technologies !== undefined) user.technologies = technologies;
    if (projectName !== undefined) user.projectName = projectName;

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- DELETE USER (admin, or staff with client-management access deleting a client) ---
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const canManageClients = hasAnyPermission(req.user, ['mgmt-clients', 'mgmt-clients-list', 'mgmt-add-client']);
      if (!canManageClients || user.role !== 'client') {
        return res.status(403).json({ message: 'Insufficient permissions for this action' });
      }
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
