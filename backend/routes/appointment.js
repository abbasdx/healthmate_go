const express = require('express');
const { body, param, query } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Doctor's appointments list
router.get('/doctor',
  authenticate, requireRole('doctor'),
  [
    query('status').optional().isArray().withMessage('Status can be an array'),
    query('status.*').optional().isString().withMessage('Each status must be a string'),
  ],
  validate,
  async (req, res) => {
    try {
      const { status } = req.query;
      const filter = { doctorId: req.auth.id };

      
      // Handle multiple status values
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        filter.status = { $in: statusArray };
      }
      
      const appointments = await Appointment.find(filter)
        .populate('patientId', 'name email phone dob age profileImage')
        .populate('doctorId', 'name fees specialization profileImage')
        .sort({ slotStartIso: 1, slotEndIso: 1 }); // Sort by actual start and end times
        
      res.ok(appointments, 'Appointments fetched successfully');
    } catch (error) {
      console.error('Doctor appointments fetch error:', error);
      res.serverError('Failed to fetch appointments', [error.message]);
    }
  }
);

// Patient's appointments list
router.get('/patient',
  authenticate, requireRole('patient'),
  [
    query('status').optional().isArray().withMessage('Status can be an array'),
    query('status.*').optional().isString().withMessage('Each status must be a string'),
  ],
  validate,
  async (req, res) => {
    try {
      const { status } = req.query;
      const filter = { patientId: req.auth.id };
      
      // Handle multiple status values
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        filter.status = { $in: statusArray };
      }

      const appointments = await Appointment.find(filter)
        .populate('doctorId', 'name specialization fees hospitalInfo profileImage')
        .populate('patientId', 'name email age')
        .sort({ slotStartIso: 1, slotEndIso: 1 }); // Sort by actual start and end times

      res.ok(appointments, 'Appointments fetched successfully');
    } catch (error) {
      console.error('Patient appointments fetch error:', error);
      res.serverError('Failed to fetch appointments', [error.message]);
    }
  }
);


// Get booked slots for a doctor on a specific date
router.get('/booked-slots/:doctorId/:date',
  async (req, res) => {
    try {
      const { doctorId, date } = req.params;
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedAppointments = await Appointment.find({
        doctorId,
        slotStartIso: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'Cancelled' } 
      }).select('slotStartIso');

      const bookedSlots = bookedAppointments.map(apt => apt.slotStartIso);
      
      res.ok(bookedSlots, 'Booked slots retrieved');
    } catch (error) {
      res.serverError('Failed to fetch booked slots', [error.message]);
    }
  }
);

// Book new appointment
router.post('/book',
  authenticate, requireRole('patient'),
  [
    body('doctorId').isMongoId().withMessage('Valid doctor ID required'),
    body('slotStartIso').isISO8601().withMessage('Valid start time required'),
    body('slotEndIso').isISO8601().withMessage('Valid end time required'),
    body('consultationType').isIn(['Video Consultation', 'Voice Call']).withMessage('Valid consultation type required'),
    body('symptoms').isString().trim().withMessage('Symptoms description required (min 10 characters)'),
    body('consultationFees').isNumeric().withMessage('Consultation fees required'),
    body('platformFees').isNumeric().withMessage('Platform fees required'),
    body('totalAmount').isNumeric().withMessage('Total amount required')
  ],
  validate,
  async (req, res) => {
    try {
      const { 
        doctorId, 
        slotStartIso, 
        slotEndIso, 
        date, 
        consultationType, 
        symptoms,
        consultationFees,
        platformFees,
        totalAmount
      } = req.body;
      
      // Check for conflicting appointments
      const conflictingAppointment = await Appointment.findOne({
        doctorId,
        status: { $in: ['Scheduled', 'In Progress'] },
        $or: [
          {
            slotStartIso: { $lt: new Date(slotEndIso) },
            slotEndIso: { $gt: new Date(slotStartIso) }
          }
        ]
      });
      
      if (conflictingAppointment) {
        return res.conflict('This time slot is already booked');
      }
    
      
      // Generate unique room ID
      const zegoRoomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const appointment = new Appointment({
        doctorId,
        patientId: req.auth.id,
        date: new Date(date),
        slotStartIso: new Date(slotStartIso),
        slotEndIso: new Date(slotEndIso),
        consultationType,
        symptoms,
        zegoRoomId,
        status: 'Scheduled',
        consultationFees,
        platformFees,
        totalAmount,
        paymentStatus: 'Pending', // Payment will be processed separately
        payoutStatus: 'Pending'
      });
      
      await appointment.save();
      
      // Populate for response
      await appointment.populate('doctorId', 'name specialization fees hospitalInfo profileImage');
      await appointment.populate('patientId', 'name email');
      
      res.created(appointment, 'Appointment booked successfully');
    } catch (error) {
      console.log('Book appointment error:', error);
      res.serverError('Failed to book appointment', [error.message]);
    }
  }
);

// Join consultation
router.get('/join/:id',
  authenticate,
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('doctorId', 'name')
        .populate('patientId', 'name');
        
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      // Update status to In Progress
      appointment.status = 'In Progress';
      await appointment.save();
      
      res.ok({
        roomId: appointment.zegoRoomId,
        appointment
      }, 'Consultation joined successfully');
    } catch (error) {
      console.error('Join consultation error:', error);
      res.serverError('Failed to join consultation', [error.message]);
    }
  }
);

// End consultation
router.put('/end/:id',
  authenticate, requireRole('doctor'),
  [
    body('prescription').optional().isString(),
    body('notes').optional().isString(),
  ],
  validate,
  async (req, res) => {
    try {
      const { prescription, notes } = req.body;
      
      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          status: 'Completed',
          prescription,
          notes,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('doctorId patientId');
      
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      res.ok(appointment, 'Consultation completed successfully');
    } catch (error) {
      console.error('End consultation error:', error);
      res.serverError('Failed to end consultation', [error.message]);
    }
  }
);

// Update appointment status (for doctors to mark as cancelled, etc.)
router.put('/status/:id',
  authenticate, requireRole('doctor'),
  [
    body('status').isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).withMessage('Valid status required')
  ],
  validate,
  async (req, res) => {
    try {
      const { status } = req.body;
      
      const appointment = await Appointment.findById(req.params.id)
        .populate('doctorId patientId');
      
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      // Check if doctor owns this appointment
      if (appointment.doctorId._id.toString() !== req.auth.id) {
        return res.forbidden('Access denied');
      }
      
      appointment.status = status;
      appointment.updatedAt = new Date();
      await appointment.save();
      
      res.ok(appointment, 'Appointment status updated successfully');
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.serverError('Failed to update appointment status', [error.message]);
    }
  }
);



// Get single appointment by ID
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('doctorId', 'name specialization fees hospitalInfo profileImage')
        .populate('patientId', 'name email phone age profileImage');
        
      if (!appointment) {
        return res.notFound('Appointment not found');
      }
      
      // Check if user has access to this appointment
      const userRole = req.auth.role || req.auth.type;
      if (userRole === 'doctor' && appointment.doctorId._id.toString() !== req.auth.id) {
        return res.forbidden('Access denied');
      }
      
      if (userRole === 'patient' && appointment.patientId._id.toString() !== req.auth.id) {
        return res.forbidden('Access denied');
      }
      
      res.ok({ appointment }, 'Appointment fetched successfully');
    } catch (error) {
      console.error('Get appointment error:', error);
      res.serverError('Failed to fetch appointment', [error.message]);
    }
  }
);

module.exports = router;