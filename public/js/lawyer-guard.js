async function checkLawyerAccess() {
  try {
    const res = await fetch('/api/lawyer/dashboard');
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
