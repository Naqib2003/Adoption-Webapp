checkLawyerAccess().then(data => { if (data) loadApproved(); });

async function loadApproved() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/lawyer/approved');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load approved adoptees.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No approved adoptees yet.</p>';
      return;
    }

    list.innerHTML = data.map(a => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/lawyer/approved/${a.application_id}'">
        <span><strong>${a.adoptee_name}</strong> (${a.adoptee_type})</span>
        <span>Approved</span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}
