checkGuardianAccess();

const tracking_meeting_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/legal-guardian/tracking-meetings/${tracking_meeting_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this meeting.';
      return;
    }

    document.getElementById('pageName').textContent = `Meeting — ${data.adoptee_name}`;
    document.getElementById('details').innerHTML = [
      ['Adoptee Type', data.adoptee_type],
      ['Adopted by', data.adopter_name],
      ['Adopter Email', data.adopter_email],
      ['Arranged by (Moderator)', data.moderator_name],
      ['Date', data.meeting_date || 'TBD'],
      ['Time', data.meeting_time || 'TBD'],
      ['Status', data.status]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    if (data.status === 'scheduled') {
      document.getElementById('actions').innerHTML = `
        <label>Report on the adoptee's current condition (required)</label>
        <textarea id="reportText" rows="4" style="width:100%; padding:10px; border:1px solid #d7ddda; border-radius:8px; font-family:inherit; font-size:14px;"></textarea>
        <button onclick="completeMeeting()" style="margin-top:12px;">Meeting Done</button>
      `;
    } else {
      document.getElementById('actions').innerHTML = `
        <div style="background:#fff4e0; border:2px solid #e0a83c; border-radius:8px; padding:12px;">
          <strong style="color:#a15c00;">Your Report</strong>
          <p style="margin:6px 0 0 0; color:#1e2a24;">${data.guardian_report}</p>
        </div>
      `;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

async function completeMeeting() {
  const messageBox = document.getElementById('message');
  const report = document.getElementById('reportText').value;

  if (!report.trim()) {
    messageBox.className = 'message error';
    messageBox.textContent = "A report on the adoptee's current condition is required.";
    return;
  }

  try {
    const res = await fetch('/api/legal-guardian/tracking-meetings/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_meeting_id: Number(tracking_meeting_id), report })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Action failed.';
      return;
    }

    window.location.href = '/guardian-tracking-meetings.html';
  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
