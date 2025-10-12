const express = require('express');
const Razorpay = require('razorpay');
const { body, param } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post('/create-order',
  authenticate, requireRole('patient'),
  [
    body('appointmentId').isMongoId().withMessage('Valid appointment ID required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { appointmentId } = req.body;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'name specialization')
        .populate('patientId', 'name email phone');
      
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      // Check if user owns this appointment
      if (appointment.patientId._id.toString() !== req.auth.id) {
        return res.forbidden('Access denied');
      }
      
      // Check if already paid
      if (appointment.paymentStatus === 'Paid') {
        return res.badRequest('Payment already completed');
      }
      
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: appointment.totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: `appointment_${appointmentId}`,
        notes: {
          appointmentId: appointmentId,
          doctorName: appointment.doctorId.name,
          patientName: appointment.patientId.name,
          consultationType: appointment.consultationType,
          date: appointment.date,
          slotStart: appointment.slotStartIso,
          slotEnd: appointment.slotEndIso
        }
      });
      
      res.ok({
        orderId: order.id,
        amount: appointment.totalAmount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      }, 'Payment order created successfully');
      
    } catch (error) {
      console.error('Create payment order error:', error);
      res.serverError('Failed to create payment order', [error.message]);
    }
  }
);

// Verify payment and update appointment
router.post('/verify-payment',
  authenticate, requireRole('patient'),
  [
    body('appointmentId').isMongoId().withMessage('Valid appointment ID required'),
    body('razorpay_order_id').isString().withMessage('Razorpay order ID required'),
    body('razorpay_payment_id').isString().withMessage('Razorpay payment ID required'),
    body('razorpay_signature').isString().withMessage('Razorpay signature required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { 
        appointmentId, 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature 
      } = req.body;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'name specialization')
        .populate('patientId', 'name email phone');
      
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      // Check if user owns this appointment
      if (appointment.patientId._id.toString() !== req.auth.id) {
        return res.forbidden('Access denied');
      }
      
      // Verify payment signature
      const crypto = require('crypto');
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      const isAuthentic = expectedSignature === razorpay_signature;
      
      if (!isAuthentic) {
        return res.badRequest('Payment verification failed');
      }
      
      // Update appointment with payment details
      appointment.paymentStatus = 'Paid';
      appointment.paymentMethod = 'Razorpay';
      appointment.razorpayOrderId = razorpay_order_id;
      appointment.razorpayPaymentId = razorpay_payment_id;
      appointment.razorpaySignature = razorpay_signature;
      appointment.paymentDate = new Date();
      
      await appointment.save();
      
      // Populate for response
      await appointment.populate('doctorId', 'name specialization fees hospitalInfo profileImage');
      await appointment.populate('patientId', 'name email');
      
      res.ok(appointment, 'Payment verified and appointment confirmed successfully');
      
    } catch (error) {
      console.error('Verify payment error:', error);
      res.serverError('Failed to verify payment', [error.message]);
    }
  }
);

// Refund payment (admin only)
router.post('/refund',
  authenticate, requireRole('admin'),
  [
    body('appointmentId').isMongoId().withMessage('Valid appointment ID required'),
    body('amount').optional().isNumeric().withMessage('Refund amount must be numeric'),
    body('reason').optional().isString().withMessage('Refund reason must be string'),
  ],
  validate,
  async (req, res) => {
    try {
      const { appointmentId, amount, reason } = req.body;
      
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      if (appointment.paymentStatus !== 'Paid') {
        return res.badRequest('Appointment is not paid');
      }
      
      if (!appointment.razorpayPaymentId) {
        return res.badRequest('No Razorpay payment ID found');
      }
      
      const refundAmount = amount ? amount * 100 : appointment.totalAmount * 100; // Convert to paise
      
      // Create refund
      const refund = await razorpay.payments.refund(appointment.razorpayPaymentId, {
        amount: refundAmount,
        notes: {
          reason: reason || 'Appointment cancellation',
          appointmentId: appointmentId
        }
      });
      
      // Update appointment
      appointment.paymentStatus = 'Refunded';
      appointment.refundId = refund.id;
      appointment.refundAmount = refundAmount / 100;
      appointment.refundDate = new Date();
      appointment.refundReason = reason || 'Appointment cancellation';
      
      await appointment.save();
      
      res.ok({
        refundId: refund.id,
        refundAmount: refundAmount / 100,
        status: refund.status
      }, 'Refund processed successfully');
      
    } catch (error) {
      console.error('Refund payment error:', error);
      res.serverError('Failed to process refund', [error.message]);
    }
  }
);

module.exports = router;
