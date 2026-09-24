// profile.html is reachable by a logged-in Adopter regardless of
// verification status, but was loading the generic VISITOR nav (which
// always shows Register/Login, with no way to know someone's actually
// logged in). This checks the real session and picks the right nav —
// same pattern as donate-nav.js.
async function loadProfileNav() {
  let isAdopter = false;
  try {
    const res = await fetch('/api/adopter/profile');
    isAdopter = res.ok;
  } catch (err) {
    isAdopter = false;
  }

  const partialUrl = isAdopter ? '/partials/adopter-nav.html' : '/partials/nav.html';

  try {
    const res = await fetch(partialUrl);
    const html = await res.text();
    const header = document.getElementById('siteHeader');
    if (header) {
      header.innerHTML = html;
      highlightActiveTab();
      if (isAdopter) {
        attachAdopterLogout();
        attachAdopterSearch();
      }
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

function attachAdopterLogout() {
  const logoutBtn = document.getElementById('adopterLogoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

function attachAdopterSearch() {
  const form = document.getElementById('adopterSearchForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = '/adopter-browse.html';
  });
}

loadProfileNav();
