checkLawyerAccess().then(data => { if (data) loadRequests(); });

async function loadRequests() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/lawyer/approval-requests');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load requests.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No pending approval requests.</p>';
      return;
    }

    list.innerHTML = data.map(a => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/lawyer/approval/${a.application_id}'">
        <span><strong>${a.adoptee_name}</strong> (${a.adoptee_type})</span>
        <span>${a.gender}, age ${a.age || '-'}</span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}
