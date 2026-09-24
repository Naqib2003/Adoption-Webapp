async function loadProfile() {
  const messageBox = document.getElementById('message');
  const profileView = document.getElementById('profileView');
  const pageTitle = document.getElementById('pageTitle');

  try {
    const res = await fetch('/api/legal-entity/profile');

    if (res.status === 401 || res.status === 403) {
      profileView.innerHTML = '';
      pageTitle.textContent = 'My Profile';
      document.getElementById('notLoggedIn').style.display = 'block';
      document.getElementById('logoutBtn').style.display = 'none';
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load profile.';
      return;
    }

    pageTitle.textContent = `My Profile — ${data.entity_type === 'police' ? 'Police' : 'Lawyer'}`;

    const rows = [
      ['Name', data.name],
      ['Email', data.email],
      ['NID No.', data.nid_no],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Age', data.age || '-'],
      ['Phone', data.phone_no || '-']
    ];

    if (data.entity_type === 'police') {
      rows.push(['Badge No.', data.badge_no || '-']);
    } else {
      rows.push(['License No.', data.license_no || '-']);
    }

    profileView.innerHTML = rows.map(([label, value]) =>
      `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`
    ).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server. Is it running?';
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

loadProfile();

// Defense in depth: if the browser still restores this page from cache on
// Back/Forward (event.persisted === true), force a fresh check with the
// server instead of trusting whatever is currently on screen.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    loadProfile();
  }
});
