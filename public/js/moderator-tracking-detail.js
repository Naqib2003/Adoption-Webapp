checkModeratorAccess();

const application_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/moderator/tracking/${application_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this record.';
      return;
    }

    document.getElementById('pageName').textContent = data.adoptee_name;
    document.getElementById('details').innerHTML = [
      ['Adoptee Type', data.adoptee_type],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Age', data.age || '-'],
      ['Adopted by', data.adopter_name],
      ['Adopter Email', data.adopter_email],
      ['Approved on', data.decided_at],
      ['Caretaker Guardian', data.guardian_name || '-'],
      ['Guardian Email', data.guardian_email || '-']
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    renderMeetings(data.meetings || []);

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

function renderMeetings(meetings) {
  const list = document.getElementById('meetingsList');
  if (meetings.length === 0) {
    list.innerHTML = '<p class="subtitle">No meetings arranged yet.</p>';
    return;
  }

  list.innerHTML = meetings.map(m => `
    <div style="border:1px solid #eee; border-radius:8px; padding:14px; margin-bottom:12px;">
      <div class="profile-row">
        <span>${m.meeting_date || 'TBD'} ${m.meeting_time || ''}</span>
        <span class="status-badge status-${m.status === 'completed' ? 'verified' : 'pending'}">${m.status}</span>
      </div>
      ${m.status === 'completed' ? `
        <div style="background:#fff4e0; border:2px solid #e0a83c; border-radius:8px; padding:12px; margin-top:10px;">
          <strong style="color:#a15c00;">Guardian Report</strong>
          <p style="margin:6px 0 0 0; color:#1e2a24;">${m.guardian_report}</p>
        </div>
      ` : '<p class="subtitle" style="margin-top:8px;">Awaiting the guardian to mark this meeting done.</p>'}
    </div>
  `).join('');
}

document.getElementById('arrangeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/moderator/tracking/arrange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: Number(application_id),
        meeting_date: document.getElementById('meeting_date').value,
        meeting_time: document.getElementById('meeting_time').value
      })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not arrange meeting.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message;
    document.getElementById('arrangeForm').reset();
    loadDetail();

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

loadDetail();
