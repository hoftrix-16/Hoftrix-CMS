const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client', 'employee'], default: 'employee' },
  avatar: { type: String, default: '' },
  designation: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  cover: { type: String, default: '' },
  permissions: { type: [String], default: [] },
  website: { type: String, default: '' },
  technologies: { type: String, default: '' },
  projectName: { type: String, default: '' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

// Hash password before saving - Optimized for modern Mongoose
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw new Error('Password hashing failed');
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
