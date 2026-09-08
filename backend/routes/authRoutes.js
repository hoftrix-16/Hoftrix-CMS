const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const router = express.Router();

const User = require('../models/User');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  authenticate,
  adminOnly,
  getJwtSecret,
} = require('../middleware/auth');

const {
  requireAuthPermission,
  blockClientRole,
  hasAnyPermission,
} = require('../middleware/authPermissions');

const { getDefaultAvatar } = require('../utils/avatar');
const { getDefaultEmployeePassword } = require('../utils/passwords');
const { isDbConnected } = require('../utils/dbStatus');

const { sendOtpEmail } = require('../mail/Mail');



function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto
    .createHash('sha256')
    .update(String(otp))
    .digest('hex');
}


// =====================================================
// FORMAT USER RESPONSE
// =====================================================

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


// =====================================================
// LOGIN
// PUBLIC ROUTE
// =====================================================

router.post('/login', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        message:
          'Database not connected. Check MongoDB Atlas IP whitelist (0.0.0.0/0) and MONGODB_URI on server.',
      });
    }

    const email = String(req.body?.email || '').trim();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({
        message:
          'Missing credentials. Email and password are required.',
      });
    }

    const escaped = email.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    const user = await User.findOne({
      email: {
        $regex: new RegExp('^' + escaped + '$', 'i'),
      },
    });

    if (!user) {
      return res.status(404).json({
        message:
          'User not found. On a new PC run: cd backend && npm run seed (MongoDB must be running).',
      });
    }

    const isMatch = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: '1d',
      }
    );

    res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Login Error:', err);

    res.status(500).json({
      message: err.message,
    });
  }
});


// =====================================================
// REGISTER CLIENT
// ADMIN OR STAFF WITH CLIENT MANAGEMENT ACCESS
// =====================================================

router.post(
  '/register',
  authenticate,
  blockClientRole,
  requireAuthPermission(
    'mgmt-clients',
    'mgmt-clients-list',
    'mgmt-add-client'
  ),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        website,
        technologies,
        projectName,
      } = req.body;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          message: 'User already exists',
        });
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

      res.status(500).json({
        message: err.message,
      });
    }
  }
);



router.post('/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .toLowerCase()
      .trim();

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });
   
    if (!user) {
      return res.status(404).json({
        message: 'User not found. Please sign up first.',
      });
    }

    // Generate 6-digit OTP
    const otp = generateOtp();

    // Hash OTP before saving
    const hashedOtp = hashOtp(otp);

    // Save hashed OTP
    user.resetPasswordOtp = hashedOtp;

    // OTP expires after 5 minutes
    user.resetPasswordOtpExpires = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // OTP is not verified yet
    user.resetPasswordOtpVerified = false;

    await user.save();

    console.log(
      `OTP generated for ${user.email}`
    );

    // Send OTP email
    const emailResult = await sendOtpEmail(
      user.email,
      otp,
      'Password Reset'
    );

    // Email failed
    if (
      !emailResult.sent &&
      !emailResult.simulated
    ) {
      console.error(
        `Failed to send OTP to ${user.email}:`,
        emailResult.error
      );

      return res.status(500).json({
        message:
          'Unable to send verification code. Please try again later.',
      });
    }

    console.log(
      `Password reset OTP sent to ${user.email}`
    );

    return res.status(200).json({
      message:
        'OTP sent successfully. It will expire in 5 minutes.',
    });
  } catch (err) {
    console.error(
      'Forgot Password Error:',
      err
    );

    return res.status(500).json({
      message:
        'Something went wrong. Please try again later.',
    });
  }
});



router.post('/verify-reset-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .toLowerCase()
      .trim();

    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required.',
      });
    }

    // OTP must be exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: 'Please enter a valid 6-digit OTP.',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found. Please sign up first.',
      });
    }

    // No OTP stored
    if (!user.resetPasswordOtp) {
      return res.status(400).json({
        message:
          'No OTP found. Please request a new OTP.',
      });
    }

    // Check OTP expiry
    if (
      !user.resetPasswordOtpExpires ||
      user.resetPasswordOtpExpires.getTime() <= Date.now()
    ) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpVerified = false;

      await user.save();

      return res.status(400).json({
        message:
          'OTP has expired. Please request a new OTP.',
      });
    }

    // Hash entered OTP
    const hashedOtp = hashOtp(otp);

    // Compare with stored hashed OTP
    if (hashedOtp !== user.resetPasswordOtp) {
      return res.status(400).json({
        message:
          'Invalid OTP. Please enter the correct OTP.',
      });
    }

    // OTP verified
    user.resetPasswordOtpVerified = true;

    await user.save();

    console.log(
      `Password reset OTP verified for ${user.email}`
    );

    return res.status(200).json({
      message: 'OTP verified successfully.',
      verified: true,
    });
  } catch (err) {
    console.error(
      'Verify Reset OTP Error:',
      err
    );

    return res.status(500).json({
      message:
        'Something went wrong. Please try again later.',
    });
  }
});


// =====================================================
// RESET PASSWORD
// PUBLIC ROUTE
// =====================================================

router.post('/reset-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .toLowerCase()
      .trim();

    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        message:
          'Email and password are required.',
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters long.',
      });
    }

    // User must have verified OTP
    // and OTP must still be within 5-minute expiry
    const user = await User.findOne({
      email,
      resetPasswordOtpVerified: true,
      resetPasswordOtpExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          'OTP verification has expired. Please request a new OTP.',
      });
    }

    // Set new password
    user.password = password;

    // Clear OTP data
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpVerified = false;

    // User schema pre-save will hash the password
    await user.save();

    console.log(
      `Password reset successfully for ${user.email}`
    );

    return res.status(200).json({
      message:
        'Password reset successfully. You can now sign in.',
    });
  } catch (err) {
    console.error(
      'Reset Password Error:',
      err
    );

    return res.status(500).json({
      message:
        'Something went wrong. Please try again later.',
    });
  }
});



router.use(authenticate);

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
      const clients = await User.find({
        role: 'client',
      }).select('-password');

      res.json(clients);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);



router.put('/update-profile', async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      phone,
      designation,
      bio,
      skills,
      avatar,
      cover,
    } = req.body;

    if (
      req.user.role !== 'admin' &&
      req.user.id !== id
    ) {
      return res.status(403).json({
        message:
          'You can only update your own profile',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    if (designation !== undefined) {
      user.designation = designation;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (skills !== undefined) {
      user.skills = skills;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    if (cover !== undefined) {
      user.cover = cover;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error(
      'Update Profile Error:',
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});



router.post('/change-password', async (req, res) => {
  try {
    const {
      id,
      currentPassword,
      newPassword,
    } = req.body;

    if (
      req.user.role !== 'admin' &&
      req.user.id !== id
    ) {
      return res.status(403).json({
        message:
          'You can only change your own password',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message:
          'Incorrect current password',
      });
    }

    user.password = newPassword;

    await user.save();

    res.json({
      message:
        'Password changed successfully!',
    });
  } catch (err) {
    console.error(
      'Change Password Error:',
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});


router.post(
  '/admin/reset-password',
  adminOnly,
  async (req, res) => {
    try {
      const { userId, email } = req.body;

      let user;

      if (userId) {
        user = await User.findById(userId);
      } else if (email) {
        user = await User.findOne({
          email: email.toLowerCase(),
        });
      } else {
        return res.status(400).json({
          message:
            'userId or email is required',
        });
      }

      const defaultPassword =
        getDefaultEmployeePassword();

      if (!user) {
        const {
          Employee,
        } = require('../models/ERPModels');

        const employee =
          await Employee.findOne({
            email: email?.toLowerCase(),
          });

        if (!employee) {
          return res.status(404).json({
            message:
              'Employee profile not found in database',
          });
        }

        user = new User({
          name: employee.name,
          email: employee.email.toLowerCase(),
          phone: employee.phone || '',
          password: defaultPassword,
          role: 'employee',
          designation:
            employee.designation || '',
          avatar:
            employee.avatar ||
            getDefaultAvatar(employee.name),
        });

        await user.save();
      } else {
        user.password = defaultPassword;

        await user.save();
      }

      res.json({
        message:
          `Password reset successfully for ${user.name}. Share the new credentials securely.`,
      });
    } catch (err) {
      console.error(
        'Admin Reset Password Error:',
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);



router.get('/profile/:id', async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.id !== req.params.id
    ) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    const user = await User.findById(
      req.params.id
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.json(user);
  } catch (err) {
    console.error(
      'Get Profile Error:',
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});



router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find().select(
      '-password'
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


router.put(
  '/users/:id/permissions',
  adminOnly,
  async (req, res) => {
    try {
      const { permissions } = req.body;

      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      user.permissions = permissions;

      await user.save();

      res.json({
        message:
          'Permissions updated successfully',

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (err) {
      console.error(
        'Update Permissions Error:',
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);



router.put(
  '/users/:id',
  async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      const isAdmin =
        req.user.role === 'admin';

      if (!isAdmin) {
        const canManageClients =
          hasAnyPermission(req.user, [
            'mgmt-clients',
            'mgmt-clients-list',
            'mgmt-add-client',
          ]);

        if (
          !canManageClients ||
          user.role !== 'client'
        ) {
          return res.status(403).json({
            message:
              'Insufficient permissions for this action',
          });
        }
      }

      const {
        name,
        email,
        phone,
        role,
        website,
        technologies,
        projectName,
      } = req.body;

      const allowedRoles = [
        'admin',
        'client',
        'employee',
      ];

      if (role !== undefined) {
        if (!isAdmin) {
          return res.status(403).json({
            message:
              'Only admins can change user roles',
          });
        }

        if (!allowedRoles.includes(role)) {
          return res.status(400).json({
            message: 'Invalid role',
          });
        }

        user.role = role;
      }

      if (name !== undefined) {
        user.name = name;
      }

      if (email !== undefined) {
        user.email = email;
      }

      if (phone !== undefined) {
        user.phone = phone;
      }

      if (website !== undefined) {
        user.website = website;
      }

      if (technologies !== undefined) {
        user.technologies = technologies;
      }

      if (projectName !== undefined) {
        user.projectName = projectName;
      }

      await user.save();

      res.json({
        message: 'User updated successfully',
        user,
      });
    } catch (err) {
      console.error(
        'Update User Error:',
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


router.delete(
  '/users/:id',
  async (req, res) => {
    try {
      const user = await User.findById(
        req.params.id
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      const isAdmin =
        req.user.role === 'admin';

      if (!isAdmin) {
        const canManageClients =
          hasAnyPermission(req.user, [
            'mgmt-clients',
            'mgmt-clients-list',
            'mgmt-add-client',
          ]);

        if (
          !canManageClients ||
          user.role !== 'client'
        ) {
          return res.status(403).json({
            message:
              'Insufficient permissions for this action',
          });
        }
      }

      await user.deleteOne();

      res.json({
        message: 'User deleted successfully',
      });
    } catch (err) {
      console.error(
        'Delete User Error:',
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);


module.exports = router;