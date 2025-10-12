const mongoose = require('mongoose');

const healthcareCategories = [
  'Primary Care',
  'Manage Your Condition', 
  'Mental & Behavioral Health',
  'Sexual Health',
  "Children's Health",
  'Senior Health',
  "Women's Health",
  "Men's Health",
  'Wellness'
];


const dailyTimeRangeSchema = new mongoose.Schema({
  start: { type: String }, // '09:00'
  end: { type: String }    // '12:00'
}, { _id: false });

const availabilityRangeSchema = new mongoose.Schema({
  startDate: { type: Date }, // inclusive
  endDate: { type: Date },   // inclusive
  excludedWeekdays: { type: [Number], default: [] } // 0=Sun
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, // can be null for Google-only users
  password: { type: String }, // optional when Google auth
  googleId: { type: String, unique: true, sparse: true },
  profileImage: { type: String, default: '' },

    specialization: { 
    type: String, 
    enum: [
      'Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 
      'Neurologist', 'Gynecologist', 'General Physician', 'ENT Specialist',
      'Psychiatrist', 'Ophthalmologist'
    ]
  },

  category: {
    type: [String], 
    enum: healthcareCategories,
    required: false,
  },
  
  

  qualification: { type: String },
  experience: { type: Number},
  about: { type: String},
  fees: { type: Number},

  hospitalInfo: {
    name: String,
    address: String,
    city: String
  },

  availabilityRange: availabilityRangeSchema, // e.g., 2025-03-01 to 2036-03-01 excluding Sundays
  dailyTimeRanges: { type: [dailyTimeRangeSchema], default: [] }, // e.g., 09:00-12:00, 14:00-16:00
  slotDurationMinutes: { type: Number, default: 30 },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);