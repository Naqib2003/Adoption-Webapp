// Handles logic for anonymous/public visitors — anything on the site that
// does NOT require being logged in as any specific role.
// Nothing complex yet; this is the landing spot for public homepage data
// (e.g. later: total families helped, total children placed, for Feature 9).

const visitorController = {

  // GET /api/visitor/roles
  // Returns the list of account types someone can register as, for the
  // landing page's "Register as..." buttons.
  getAvailableRoles: (req, res) => {
    res.json([
      { role: 'adopter', label: 'Register as Adopter' },
      { role: 'legalGuardian', label: 'Register as Legal Guardian' },
      { role: 'legalEntity', label: 'Register as Legal Entity' }
    ]);
  }

};

module.exports = visitorController;
