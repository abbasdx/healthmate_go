const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

const signToken = (id, type) =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Local register (Doctor)
router.post('/doctor/register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  validate,
  async (req, res) => {
    try {
      const exists = await Doctor.findOne({ email: req.body.email });
      if (exists) return res.badRequest('Doctor already exists');
      const hashed = await bcrypt.hash(req.body.password, 12);
      const doc = await Doctor.create({ ...req.body, password: hashed });
      const token = signToken(doc._id, 'doctor');
      res.created({ token, user: { id: doc._id, type: 'doctor' } }, 'Doctor registered');
    } catch (e) {
      res.serverError('Registration failed', [e.message]);
    }
  }
);

// Local login (Doctor)
router.post('/doctor/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const doc = await Doctor.findOne({ email: req.body.email });
      if (!doc || !doc.password) return res.unauthorized('Invalid credentials');
      const ok = await bcrypt.compare(req.body.password, doc.password);
      if (!ok) return res.unauthorized('Invalid credentials');
      const token = signToken(doc._id, 'doctor');
      res.ok({ token, user: { id: doc._id, type: 'doctor' } }, 'Login successful');
    } catch (e) {
      res.serverError('Login failed', [e.message]);
    }
  }
);

// Local register (Patient)
router.post('/patient/register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  async (req, res) => {
    try {
      const exists = await Patient.findOne({ email: req.body.email });
      if (exists) return res.badRequest('Patient already exists');
      const hashed = await bcrypt.hash(req.body.password, 12);
      const patient = await Patient.create({ ...req.body, password: hashed });
      const token = signToken(patient._id, 'patient');
      res.created({ token, user: { id: patient._id, type: 'patient' } }, 'Patient registered');
    } catch (e) {
      res.serverError('Registration failed', [e.message]);
    }
  }
);

// Local login (Patient)
router.post('/patient/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const patient = await Patient.findOne({ email: req.body.email });
      if (!patient || !patient.password) return res.unauthorized('Invalid credentials');
      const ok = await bcrypt.compare(req.body.password, patient.password);
      if (!ok) return res.unauthorized('Invalid credentials');
      const token = signToken(patient._id, 'patient');
      res.ok({ token, user: { id: patient._id, type: 'patient' } }, 'Login successful');
    } catch (e) {
      res.serverError('Login failed', [e.message]);
    }
  }
);

// Google OAuth start
router.get('/google', (req, res, next) => {
  const userType = req.query.type || 'patient';
  
  // Pass userType as state parameter
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: userType,  // ✅ This preserves the type through OAuth flow
    prompt: 'select_account'  // Force account selection to ensure state is preserved
  })(req, res, next);
});


// ✅ Updated: Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/auth/failure' 
  }),
  async (req, res) => {
    try {
      const { user, type } = req.user;
      const token = signToken(user._id, type);
      
      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/success?token=${token}&type=${type}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }))}`;
      
      res.redirect(redirectUrl);
    } catch (e) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(e.message)}`);
    }
  }
);
// Auth failure (for redirects)
router.get('/failure', (req, res) => res.badRequest('Google authentication failed'));

module.exports = router;