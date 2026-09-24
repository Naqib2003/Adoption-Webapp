// Shared by every verified-adopter page (Home, Browse, Application
// Tracker, Donate). Confirms the visitor is logged in AND verified
// before letting them see enhanced content — redirects otherwise.
// Returns { name } on success, or null after redirecting away.
async function checkAdopterAccess() {
  try {
    const res = await fetch('/api/adopter/dashboard');

    if (res.status === 401) {
      window.location.href = '/login.html'; // not logged in at all
      return null;
    }
    if (res.status === 403) {
      window.location.href = '/profile.html'; // logged in but not verified yet
      return null;
    }
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (err) {
    return null;
  }
}
