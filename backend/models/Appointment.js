const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  date: { type: Date, required: true }, // day of appointment (date-only semantic)
  slotStartIso: { type: String, required: true }, // ISO start of the slot (UTC)
  slotEndIso: { type: String, required: true },   // ISO end of the slot (UTC)

  consultationType: {
    type: String,
    enum: ['Video Consultation', 'Voice Call'],
    default: 'Video Consultation'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'In Progress'],
    default: 'Scheduled'
  },
  symptoms: { type: String, default: '' },
  zegoRoomId: { type: String, default: '' },
  prescription: { type: String, default: '' },
  notes: { type: String, default: '' },

  // Payment fields
  consultationFees: { type: Number, required: true }, // Doctor's consultation fees
  platformFees: { type: Number, required: true }, // Platform commission (e.g., 10% of consultation fees)
  totalAmount: { type: Number, required: true }, // Total amount paid by patient
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending'
  },
  payoutStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled'],
    default: 'Pending'
  },
  payoutDate: { type: Date }, // When the doctor was paid
  paymentMethod: { type: String, default: 'Online' },
  
  // Razorpay payment fields
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentDate: { type: Date },
  
  // Refund fields
  refundId: { type: String },
  refundAmount: { type: Number },
  refundDate: { type: Date },
  refundReason: { type: String }
}, { timestamps: true });

// 1 means ascending order 
// unique: true means uniqueness is enforced across that combination of fields.
// MongoDB will not allow two appointments with the same doctorId, date, and slotStartIso.

appointmentSchema.index({ doctorId: 1, date: 1, slotStartIso: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);