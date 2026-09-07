const mongoose = require('mongoose');

// --- SERVICE CATALOG MODEL ---
const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  basePrice: { type: Number, required: true },
  currency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
  category: { type: String, enum: ['Web Development', 'App Development', 'SEO', 'UI/UX Design', 'Maintenance'], default: 'Web Development' },
  createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
