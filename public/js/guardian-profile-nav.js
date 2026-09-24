// Same fix as profile-nav.js, for the Legal Guardian equivalent page.
async function loadGuardianProfileNav() {
  let isGuardian = false;
  try {
    const res = await fetch('/api/legal-guardian/profile');
    isGuardian = res.ok;
  } catch (err) {
    isGuardian = false;
  }

  const partialUrl = isGuardian ? '/partials/guardian-dashboard-nav.html' : '/partials/nav.html';

  try {
    const res = await fetch(partialUrl);
    const html = await res.text();
    const header = document.getElementById('siteHeader');
    if (header) {
      header.innerHTML = html;
      highlightActiveTab();
      if (isGuardian) attachGuardianLogout();
    }
  } catch (err) {}
}

function highlightActiveTab() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

function attachGuardianLogout() {
  const logoutBtn = document.getElementById('guardianLogoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

loadGuardianProfileNav();
