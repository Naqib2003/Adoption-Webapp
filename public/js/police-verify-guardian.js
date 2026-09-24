async function loadPending() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');
  messageBox.className = 'message';
  messageBox.textContent = '';

  try {
    const res = await fetch('/api/police/pending-guardians');

    if (res.status === 401 || res.status === 403) {
      list.innerHTML = '';
      messageBox.className = 'message error';
      messageBox.textContent = 'You must be logged in as Police to view this page.';
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load pending guardians.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No pending requests.</p>';
      return;
    }

    list.innerHTML = data.map(g => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/police/guardian/${g.LG_ID}'">
        <span><strong>${g.name}</strong></span>
        <span>${g.email}</span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server. Is it running?';
  }
}

loadPending();
