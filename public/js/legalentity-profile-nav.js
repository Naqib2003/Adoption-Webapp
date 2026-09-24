// Legal Entity covers TWO roles sharing one profile page (Police and
// Lawyer), each with their own separate dashboard nav — so this checks
// WHICH one before picking a partial, not just whether logged in at all.
async function loadLegalEntityProfileNav() {
  let role = null;
  try {
    const res = await fetch('/api/legal-entity/profile');
    if (res.ok) {
      const data = await res.json();
      role = data.entity_type; // 'police' or 'lawyer'
    }
  } catch (err) {}

  let partialUrl, logoutId, logoutEndpoint;
  if (role === 'police') {
    partialUrl = '/partials/police-nav.html';
    logoutId = 'policeLogoutBtn';
  } else if (role === 'lawyer') {
    partialUrl = '/partials/lawyer-nav.html';
    logoutId = 'lawyerLogoutBtn';
  } else {
    partialUrl = '/partials/nav.html';
  }

  try {
    const res = await fetch(partialUrl);
    const html = await res.text();
    const header = document.getElementById('siteHeader');
    if (header) {
      header.innerHTML = html;
      highlightActiveTab();
      if (logoutId) attachLogout(logoutId);
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

function attachLogout(id) {
  const logoutBtn = document.getElementById(id);
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

loadLegalEntityProfileNav();
