// Confirms the visitor is logged in as a Moderator before showing any
// dashboard content. Returns { name } on success, or null after redirecting.
async function checkModeratorAccess() {
  try {
    const res = await fetch('/api/moderator/dashboard');
    if (res.status === 401 || res.status === 403) {
      window.location.href = '/login.html';
      return null;
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
