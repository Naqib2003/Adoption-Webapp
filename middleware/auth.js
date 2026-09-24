// Blocks the request unless someone is logged in (any role)
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  next();
}

// Blocks the request unless the logged-in user's role is one of the allowed ones
// Usage: requireRole('police')  or  requireRole('family', 'legalGuardian')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }
    if (!allowedRoles.includes(req.session.userRole)) {
      return res.status(403).json({ error: 'Not authorized for this action.' });
    }
    next();
  };
}

// Blocks the request unless the logged-in user has been verified by a
// Legal Entity (police). Use AFTER requireRole, e.g.:
//   router.get('/browse', requireRole('family'), requireVerified, controller.browse);
function requireVerified(req, res, next) {
  if (!req.session.verified) {
    return res.status(403).json({
      error: 'Your profile is still pending verification by a Legal Entity. This page is not available yet.'
    });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireVerified };
