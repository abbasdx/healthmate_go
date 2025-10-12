const computeAgeFromDob = dob => {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const isoDateOnly = d => {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const parseTime = t => {
  // expects 'HH:mm'
  const [h, m] = (t || '').split(':').map(Number);
  return { h, m };
};

module.exports = { computeAgeFromDob, isoDateOnly, parseTime };