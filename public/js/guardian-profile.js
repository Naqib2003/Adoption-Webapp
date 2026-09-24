async function loadProfile() {
  const messageBox = document.getElementById('message');
  const profileView = document.getElementById('profileView');

  try {
    const res = await fetch('/api/legal-guardian/profile');

    if (res.status === 401 || res.status === 403) {
      profileView.innerHTML = '';
      const badge = document.getElementById('statusBadge');
      if (badge) { badge.textContent = 'N/A'; badge.className = 'status-badge'; }
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

    const status = data.verification_status || 'pending';
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = status;
    statusBadge.className = 'status-badge status-' + status;

    const rows = [
      ['Name', data.name],
      ['Email', data.email],
      ['NID No.', data.nid_no],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Religion', data.religion || '-'],
      ['Profession', data.profession || '-'],
      ['Age', data.age || '-'],
      ['Phone', (data.phones && data.phones.length) ? data.phones.join(', ') : '-']
    ];

    if (data.address) {
      rows.push(['Address', [data.address.house_no, data.address.street, data.address.zipcode, data.address.city_village, data.address.district].filter(Boolean).join(', ')]);
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
