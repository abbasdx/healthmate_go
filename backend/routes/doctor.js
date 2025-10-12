const express = require('express');
const { body, query } = require('express-validator');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Get doctors with search/sort/filter (UI-ready)
router.get('/list',
  [
    query('search').optional().isString(),
    query('specialization').optional().isString(),
    query('city').optional().isString(),
    query('category').optional().isString(),
    query('minFees').optional().isInt({ min: 0 }),
    query('maxFees').optional().isInt({ min: 0 }),
    query('sortBy').optional().isIn(['fees', 'experience', 'name', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req, res) => {
    try {
      const {
        search, specialization, city, minFees, maxFees,category,
        sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20
      } = req.query;

      const filter = { isVerified: true };
      if (specialization) filter.specialization = { $regex: `^${specialization}$`, $options: 'i' };
      if (city) filter['hospitalInfo.city'] = { $regex: city, $options: 'i' };
    if (category) {
        filter.category = category;
      }
      if (minFees || maxFees) {
        filter.fees = {};
        if (minFees) filter.fees.$gte = Number(minFees);
        if (maxFees) filter.fees.$lte = Number(maxFees);
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
          { 'hospitalInfo.name': { $regex: search, $options: 'i' } }
        ];
      }

      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      const skip = (Number(page) - 1) * Number(limit);

      const [items, total] = await Promise.all([
        Doctor.find(filter).select('-password -googleId').sort(sort).skip(skip).limit(Number(limit)),
        Doctor.countDocuments(filter)
      ]);

      res.ok(items, 'Doctors fetched', { page: Number(page), limit: Number(limit), total });
    } catch (e) {
        console.error("Doctor fetch failed:", e);
      res.serverError('Fetching doctors failed', [e.message]);
    }
  }
);

// Get profile of current doctor
router.get('/me', authenticate, requireRole('doctor'), async (req, res) => {
  const doc = await Doctor.findById(req.user._id).select('-password -googleId');
  res.ok(doc, 'Profile');
});

// Update doctor profile
router.put('/onboarding/update',
  authenticate, requireRole('doctor'),
  [
    body('name').optional().notEmpty(),
    body('specialization').optional().notEmpty(),
    body('qualification').optional().notEmpty(),
    body('category').optional().notEmpty(),
    body('experience').optional().isInt({ min: 0 }),
    body('about').optional().isString(),
    body('fees').optional().isInt({ min: 0 }),
    body('hospitalInfo').optional().isObject(),
    body('availabilityRange.startDate').isISO8601(),
    body('availabilityRange.endDate').isISO8601(),
    body('availabilityRange.excludedWeekdays').optional().isArray(),
    body('dailyTimeRanges').isArray({ min: 1 }),
    body('dailyTimeRanges.*.start').isString(),
    body('dailyTimeRanges.*.end').isString(),
    body('slotDurationMinutes').optional().isInt({ min: 5, max: 180 })
  ],
  validate,
  async (req, res) => {
    try {
      const updates = { ...req.body };
      delete updates.password;
      updates.isVerified = true;
      const doc = await Doctor.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -googleId');
      res.ok(doc, 'Profile updated');
    } catch (e) {
      res.serverError('Update failed', [e.message]);
    }
  }
);

// routes/doctor.js
router.get('/dashboard', authenticate, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = req.auth.id;
    
    const now = new Date();
    
    // Fix: Proper date range calculation
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Today's appointments with full population
    const todayAppointments = await Appointment.find({
      doctorId,
      slotStartIso: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'Cancelled' }
    })
    .populate('patientId', 'name profileImage age email phone')
    .populate('doctorId', 'name fees profileImage specialization')
    .sort({ slotStartIso: 1 });

    console.log('Today\'s appointments:', todayAppointments.length);

    // Upcoming appointments (future appointments, not just next 3 days)
    const upcomingAppointments = await Appointment.find({
      doctorId,
      date: { $gt: endOfDay }, // All future appointmentsv
      status: { $in: 'Scheduled'} // Only active appointments
    })
    .populate('patientId', 'name profileImage age email phone')
    .populate('doctorId', 'name fees profileImage specialization')
    .sort({ slotStartIso: 1 })
    .limit(5);



    // Unique patients count
    const uniquePatientIds = await Appointment.distinct('patientId', { doctorId });
    const totalPatients = uniquePatientIds.length;

    const completedAppointments = await Appointment.countDocuments({ 
      doctorId, 
      status: 'Completed' 
    });
    
    // Weekly revenue
    const totalAppointments = await Appointment.find({
      doctorId,
      status: 'Completed'
    });
    const totalRevenue = totalAppointments.reduce((sum, apt) => sum + (apt.fees || doctor.fees || 0), 0);

    const dashboardData = {
      user: {
        name: doctor.name,
        fees: doctor.fees,
        profileImage: doctor.profileImage,
        specialization: doctor.specialization,
        hospitalInfo: doctor.hospitalInfo
      },
      stats: {
        totalPatients,
        todayAppointments: todayAppointments.length,
        totalRevenue,
        completedAppointments,
        averageRating: 4.8
      },
      todayAppointments,
      upcomingAppointments,
      performance: {
        patientSatisfaction: 4.8,
        completionRate: 98,
        responseTime: '< 2min'
      }
    };

    res.ok(dashboardData, 'Dashboard data retrieved');
  } catch (error) {
    console.error('Dashboard error:', error);
    res.serverError('Failed to fetch dashboard data', [error.message]);
  }
});


// routes/patient.js or routes/doctor.js
router.get('/:doctorId',
  validate,
  async (req, res) => {
    try {
      const { doctorId } = req.params;

      const doctor = await Doctor.findById(doctorId)
        .select('-password -googleId')
        .lean();

      if (!doctor) {
        return res.notFound('Doctor not found');
      }

      // Return complete doctor information
      res.ok(doctor, 'Doctor details fetched successfully');
    } catch (e) {
      console.error('Fetch doctor failed:', e);
      res.serverError('Fetching doctor failed', [e.message]);
    }
  }
);

module.exports = router;