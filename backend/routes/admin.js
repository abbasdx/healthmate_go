const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { authenticate, requireAdmin, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

const signToken = (id, type) =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Admin Login
router.post('/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  validate,
  async (req, res) => {
    try {
      const admin = await Admin.findOne({ email: req.body.email });
      if (!admin || !admin.isActive) {
        return res.unauthorized('Invalid credentials or inactive account');
      }
      
      const isValidPassword = await bcrypt.compare(req.body.password, admin.password);
      if (!isValidPassword) {
        return res.unauthorized('Invalid credentials');
      }
      
      // Update last login
      admin.lastLogin = new Date();
      await admin.save();
      
      const token = signToken(admin._id, 'admin');
      res.ok({ 
        token, 
        user: { 
          id: admin._id, 
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          type: 'admin' 
        } 
      }, 'Admin login successful');
    } catch (e) {
      res.serverError('Login failed', [e.message]);
    }
  }
);

// Get Admin Profile
router.get('/profile', authenticate, requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    res.ok(admin, 'Admin profile retrieved');
  } catch (e) {
    res.serverError('Failed to fetch profile', [e.message]);
  }
});

// Dashboard Statistics
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalRevenue
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Scheduled' }),
      // Calculate total revenue from completed appointments
      Appointment.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Appointment.aggregate([
      { 
        $match: { 
          status: 'Completed',
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get additional reports data for charts
    const [userGrowth, appointmentStats] = await Promise.all([
      // User growth data
      Patient.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            patients: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      
      // Appointment statistics
      Appointment.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.ok({
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      monthlyRevenue,
      userGrowth,
      appointmentStats
    }, 'Dashboard data retrieved');
  } catch (e) {
    res.serverError('Failed to fetch dashboard data', [e.message]);
  }
});

// User Management - Get All Users
router.get('/users', authenticate, requireAdmin, requirePermission('userManagement'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (type) {
      query = { ...query, type };
    }
    if (search) {
      query = { ...query, $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]};
    }

    const [patients, doctors] = await Promise.all([
      Patient.find(query).select('-password').skip(skip).limit(parseInt(limit)),
      Doctor.find(query).select('-password').skip(skip).limit(parseInt(limit))
    ]);

    const users = [
      ...patients.map(p => ({ ...p.toObject(), type: 'patient' })),
      ...doctors.map(d => ({ ...d.toObject(), type: 'doctor' }))
    ];

    res.ok(users, 'Users retrieved');
  } catch (e) {
    res.serverError('Failed to fetch users', [e.message]);
  }
});

// User Management - Update User Status
router.put('/users/:userId/status', authenticate, requireAdmin, requirePermission('userManagement'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // First check which collection the user belongs to
    const patient = await Patient.findById(userId);
    const doctor = await Doctor.findById(userId);

    let updatedUser;
    if (patient) {
      updatedUser = await Patient.findByIdAndUpdate(userId, { isActive }, { new: true }).select('-password');
    } else if (doctor) {
      updatedUser = await Doctor.findByIdAndUpdate(userId, { isActive }, { new: true }).select('-password');
    } else {
      return res.notFound('User not found');
    }

    res.ok(updatedUser, 'User status updated');
  } catch (e) {
    res.serverError('Failed to update user status', [e.message]);
  }
});



// Payment Management - Get Payouts
router.get('/payments', authenticate, requireAdmin, requirePermission('paymentManagement'), async (req, res) => {
  try {
    const { page = 1, limit = 10, payoutStatus } = req.query;
    const skip = (page - 1) * limit;

    let matchQuery = { status: 'Completed' };
    if (payoutStatus) {
      matchQuery.payoutStatus = payoutStatus;
    }

    // Get completed appointments with payment details
    const appointments = await Appointment.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $lookup: { from: 'patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
      { $unwind: '$patient' },
      {
        $project: {
          _id: 1,
          date: 1,
          doctorName: '$doctor.name',
          doctorEmail: '$doctor.email',
          patientName: '$patient.name',
          consultationFees: 1,
          platformFees: 1,
          totalAmount: 1,
          paymentStatus: 1,
          payoutStatus: 1,
          payoutDate: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    res.ok(appointments, 'Payments retrieved');
  } catch (e) {
    res.serverError('Failed to fetch payments', [e.message]);
  }
});

// Process Payout to Doctor
router.put('/payments/:appointmentId/payout', authenticate, requireAdmin, requirePermission('paymentManagement'), async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { payoutStatus } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.notFound('Appointment not found');
    }

    if (appointment.status !== 'Completed') {
      return res.badRequest('Can only process payouts for completed appointments');
    }

    const updateData = { payoutStatus };
    if (payoutStatus === 'Paid') {
      updateData.payoutDate = new Date();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    ).populate('doctorId', 'name email').populate('patientId', 'name email');

    // Note: Only consultation fees are paid to doctors, platform fees are kept by admin
    const payoutAmount = appointment.consultationFees;
    const platformFees = appointment.platformFees;

    res.ok({
      ...updatedAppointment.toObject(),
      payoutAmount,
      platformFees,
      message: `Payout ${payoutStatus.toLowerCase()} successfully. Doctor receives ₹${payoutAmount}, Platform keeps ₹${platformFees}`
    }, `Payout ${payoutStatus.toLowerCase()} successfully`);
  } catch (e) {
    res.serverError('Failed to process payout', [e.message]);
  }
});


module.exports = router;
