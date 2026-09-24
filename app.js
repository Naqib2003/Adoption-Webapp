const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());

// Prevent the browser from caching HTML pages in its back/forward cache.
// Without this, hitting Back after logout can show a stale, still-logged-in
// page even though the server-side session is already destroyed.
app.use(express.static('public', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Never let the browser cache API responses either — without this, a GET
// like /api/adopter/profile could theoretically be served from browser
// cache instead of hitting the server, even after logout.
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

app.use('/api/visitor', require('./routes/visitor/visitorRoutes'));
app.use('/api/auth', require('./routes/auth/authRoutes'));
app.use('/api/adopter', require('./routes/adopter/adopterRoutes'));
app.use('/api/adopter/adoptees', require('./routes/adopter/browseRoutes'));
app.use('/api/legal-guardian', require('./routes/legalGuardian/legalGuardianRoutes'));
app.use('/api/legal-guardian/adoptees', require('./routes/legalGuardian/enlistRoutes'));
app.use('/api/legal-entity', require('./routes/legalEntity/legalEntityRoutes'));
app.use('/api/police', require('./routes/police/policeRoutes'));
app.use('/api/adopter/applications', require('./routes/adopter/applicationRoutes'));
app.use('/api/legal-guardian/applications', require('./routes/legalGuardian/applicationRoutes'));
app.use('/api/moderator', require('./routes/moderator/moderatorRoutes'));
app.use('/api/lawyer', require('./routes/lawyer/lawyerRoutes'));
app.use('/api/legal-guardian/donations', require('./routes/legalGuardian/donationRoutes'));
app.use('/api/donations', require('./routes/donation/publicDonationRoutes'));
app.use('/api/legal-guardian', require('./routes/legalGuardian/trackingRoutes'));

// Dynamic detail-page routes (Express :id parameters). Each one serves the
// matching static template — the page's own JS then reads the id out of
// the URL and fetches the real data for it. This is the "list item ->
// its own page" pattern, same idea as clicking a product on a shopping site.
function sendDetailPage(fileName) {
  return (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(__dirname, 'public', fileName));
  };
}

app.get('/adoptee/:id', sendDetailPage('adoptee-detail.html'));
app.get('/police/adopter/:id', sendDetailPage('police-adopter-detail.html'));
app.get('/police/guardian/:id', sendDetailPage('police-guardian-detail.html'));
app.get('/police/adoptee/:id', sendDetailPage('police-adoptee-detail.html'));
app.get('/guardian/adoptee/:id', sendDetailPage('guardian-adoptee-detail.html'));
app.get('/guardian/applicant/:id', sendDetailPage('guardian-applicant-detail.html'));
app.get('/moderator/adoptee/:id', sendDetailPage('moderator-adoptee-detail.html'));
app.get('/moderator/lawyer/:id', sendDetailPage('moderator-lawyer-detail.html'));
app.get('/moderator/tracking/:id', sendDetailPage('moderator-tracking-detail.html'));
app.get('/lawyer/meeting/:id', sendDetailPage('lawyer-meeting-detail.html'));
app.get('/lawyer/approval/:id', sendDetailPage('lawyer-approval-detail.html'));
app.get('/lawyer/approved/:id', sendDetailPage('lawyer-approved-detail.html'));
app.get('/donate/money/:id', sendDetailPage('donate-money-detail.html'));
app.get('/donate/wishlist/:id', sendDetailPage('donate-wishlist-detail.html'));
app.get('/guardian/donation-settings/:id', sendDetailPage('guardian-donation-settings.html'));
app.get('/guardian/tracking-meeting/:id', sendDetailPage('guardian-tracking-meeting-detail.html'));
app.get('/guardian/adoptee-reapply/:id', sendDetailPage('guardian-adoptee-reapply.html'));

app.listen(3000, () => {
  console.log('EvergreenBonds server running at http://localhost:3000');
});
