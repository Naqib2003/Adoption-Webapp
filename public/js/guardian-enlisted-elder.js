checkGuardianAccess();

async function loadEnlisted() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/legal-guardian/adoptees/enlisted-elders');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load enlisted elders.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No elders enlisted yet.</p>';
      return;
    }

    list.innerHTML = data.map(e => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/guardian/adoptee/${e.AE_ID}'">
        <span><strong>${e.name}</strong></span>
        <span style="display:flex; align-items:center; gap:8px;">
          ${e.status === 'placed' ? '<span class="status-badge status-verified">Adopted</span>' : ''}
          <span>${e.gender}, age ${e.age || '-'}</span>
        </span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadEnlisted();
