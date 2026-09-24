fetch('/partials/lawyer-nav.html')
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

function highlightActiveTab() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

function attachLogout() {
  const logoutBtn = document.getElementById('lawyerLogoutBtn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}
