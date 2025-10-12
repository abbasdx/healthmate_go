// passport-config.js or your passport file
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

require('dotenv').config();

// ✅ Updated: Access state parameter in strategy
passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // ✅ Get userType from state parameter instead of query.type
    const userType = req.query.state || 'patient';
    console.log('User type from state:', userType); // Debug log
    
     const { emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const photo = photos[0].value;

    if (userType === 'doctor') {
      let user = await Doctor.findOne({ email });
      
      if (!user) {
        user = await Doctor.create({
          googleId: profile.id,
          email,
          name: displayName,
          profileImage: photo,
          isVerified: true
        });
      } else {
        if (!user.googleId) { 
          user.googleId = profile.id; 
          user.profileImage=photo
          await user.save(); 
        }
      }
      return done(null, { user, type: 'doctor' });
    } else {
      let user = await Patient.findOne({ email });
      
      if (!user) {
        user = await Patient.create({
          googleId: profile.id,
          email,
          name: displayName,
          profileImage: photo,
           isVerified: true
        });
      } else {
        if (!user.googleId) { 
          user.googleId = profile.id; 
          user.profileImage=photo
          await user.save(); 
        }
      }
      return done(null, { user, type: 'patient' });
    }
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
