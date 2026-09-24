// donate.html is the one page in the whole app viewed by BOTH visitors
// AND logged-in Adopters — every other page has exactly one audience,
// so this is the only place that needs to pick a nav at runtime instead
// of having it hardcoded in the HTML.
async function loadDonateNav() {
  let isAdopter = false;
  try {
    const res = await fetch('/api/donations/whoami');
    const data = await res.json();
    isAdopter = data.isAdopter;
  } catch (err) {
    // fall through — treat as visitor
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
  } catch (err) {
    // page still works without a nav bar
  }
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

loadDonateNav();
