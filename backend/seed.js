require('./utils/cryptoFix');
require('./utils/dnsFix');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hoftrix_db';

async function seedAdmin() {
  // Local defaults so shared projects can login after one seed command
  const isProd = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL || (!isProd ? 'hoftrix16@gmail.com' : null);
  const adminPassword = process.env.ADMIN_PASSWORD || (!isProd ? 'Ashu123@' : null);

  if (!adminEmail || !adminPassword) {
    console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before running seed.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');
    console.log('📊 Database:', mongoose.connection.name);

    await User.deleteMany({ role: 'admin' });

    const user = new User({
      name: process.env.ADMIN_NAME || 'Hoftrix Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: process.env.ADMIN_PHONE || '7889356866',
    });

    await user.save();

    console.log('✅ Admin user created');
    console.log('   Email   :', user.email);
    console.log('   Password: (hidden — check ADMIN_PASSWORD in backend/.env)');
    console.log('👉 Login at http://localhost:5173/auth/sign-in');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message || error);
    process.exit(1);
  }
}

seedAdmin();
