const express = require('express');
const { body, query } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { computeAgeFromDob } = require('../utils/date');

const router = express.Router();

// Get own profile
router.get('/me', authenticate, requireRole('patient'), async (req, res) => {
  res.ok(await Patient.findById(req.user._id).select('-password -googleId'), 'Profile');
});

// Update own profile (auto derive age if dob provided)
router.put(
  '/onboarding/update',
  authenticate,
  requireRole('patient'),
  [
    body('name').optional().notEmpty(),
    body('phone').optional().isString(),
    body('dob').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('bloodGroup').optional().isString(),
    body('profileImage').optional().isString(),

    // Emergency contact
    body('emergencyContact').optional().isObject(),
    body('emergencyContact.name').optional().isString().notEmpty(),
    body('emergencyContact.phone').optional().isString().notEmpty(),
    body('emergencyContact.relationship').optional().isString().notEmpty(),

    // Medical history
    body('medicalHistory').optional().isObject(),
    body('medicalHistory.allergies').optional().isString(),
    body('medicalHistory.currentMedications').optional().isString(),
    body('medicalHistory.chronicConditions').optional().isString()
  ],
  validate,
  async (req, res) => {
    try {
      const updates = { ...req.body };

      if (updates.dob) {
        updates.age = computeAgeFromDob(updates.dob);
      }

      delete updates.password; // prevent password update
      updates.isVerified = true;

      const pat = await Patient.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true }
      ).select('-password -googleId');

      res.ok(pat, 'Profile updated');
    } catch (e) {
      res.serverError('Update failed', [e.message]);
    }
  }
);

module.exports = router;
