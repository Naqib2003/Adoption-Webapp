checkLawyerAccess().then(data => { if (data) loadMeetings(); });

async function loadMeetings() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/lawyer/meetings');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load meetings.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No meetings scheduled.</p>';
      return;
    }

    list.innerHTML = data.map(m => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/lawyer/meeting/${m.meeting_id}'">
        <span><strong>${m.adoptee_name}</strong> (${m.adoptee_type})</span>
        <span>${m.meeting_date || 'TBD'} ${m.meeting_time || ''}</span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}
