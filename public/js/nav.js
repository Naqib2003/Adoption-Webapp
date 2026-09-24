// Loads the shared header/nav bar into every page that has a
// <header id="siteHeader"></header> placeholder, so we only maintain
// the 8-tab menu in ONE file (partials/nav.html) instead of copy-pasting
// it into every HTML page.
fetch('/partials/nav.html')
  .then(res => res.text())
  .then(html => {
    const header = document.getElementById('siteHeader');
    if (header) {
      header.innerHTML = html;
      highlightActiveTab();
    }
  })
  .catch(() => {
    // If this fails (e.g. server not running yet), the page still works,
    // it just won't have a nav bar — fails safe, doesn't break the page.
  });

function highlightActiveTab() {
  // Links are now absolute ('/index.html'), so compare against the full
  // pathname directly instead of just the last URL segment.
  const currentPath = window.location.pathname === '/' ? '/index.html' : window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}
