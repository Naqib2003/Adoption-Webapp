// Shared by every verified-guardian page (Home, Enlisted Children,
// Enlisted Elder, New Request, Enlist). Confirms the visitor is logged
// in AND verified before showing enhanced content — redirects otherwise.
// Returns { name } on success, or null after redirecting away.
async function checkGuardianAccess() {
  try {
    const res = await fetch('/api/legal-guardian/dashboard');

    if (res.status === 401) {
      window.location.href = '/login.html'; // not logged in at all
      return null;
    }
    if (res.status === 403) {
      window.location.href = '/guardian-profile.html'; // logged in but not verified yet
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
