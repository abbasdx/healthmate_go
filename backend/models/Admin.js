const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  permissions: {
    userManagement: { type: Boolean, default: true },
    doctorManagement: { type: Boolean, default: true },
    paymentManagement: { type: Boolean, default: true },
    pharmacyManagement: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
