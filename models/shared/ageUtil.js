// Single source of truth for turning a date of birth into an age.
// Used at account/adoptee CREATION time (so age gets stored once,
// server-computed, never typed by a user) and by the matching engine
// as a defensive fallback.
function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

module.exports = { calculateAge };
