checkModeratorAccess().then(data => { if (data) loadAdoptees(); });

const statusLabels = {
  pending_moderator: 'Needs lawyer assignment',
  pending_lawyer_approval: 'Awaiting lawyer decision'
};

async function loadAdoptees() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/moderator/adoptees');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load adoptees.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No cases assigned to you right now.</p>';
      return;
    }

    list.innerHTML = data.map(a => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/moderator/adoptee/${a.application_id}'">
        <span><strong>${a.adoptee_name}</strong> (${a.adoptee_type})</span>
        <span>${statusLabels[a.status] || a.status}</span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}
