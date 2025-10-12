const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@doctorconsultation.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new Admin({
      name: 'System Administrator',
      email: 'admin@doctorconsultation.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      permissions: {
        userManagement: true,
        doctorManagement: true,
        paymentManagement: true,
        analytics: true
      }
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@doctorconsultation.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
