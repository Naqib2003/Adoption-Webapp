// Same pattern as nav.js, but loads the Police-specific 3-tab menu instead
// of the visitor menu — Police shouldn't see "Register as..." tabs.
fetch('/partials/police-nav.html')
  .then(res => res.text())
  .then(html => {
    const header = document.getElementById('siteHeader');
    if (header) {
      header.innerHTML = html;
      highlightActiveTab();
      attachLogout();
    }
  })
  .catch(() => {});

function attachLogout() {
  const logoutBtn = document.getElementById('policeLogoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

function highlightActiveTab() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}
