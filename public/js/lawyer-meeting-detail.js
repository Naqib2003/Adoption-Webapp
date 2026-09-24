checkLawyerAccess();

const meeting_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/lawyer/meetings/${meeting_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this meeting.';
      return;
    }

    document.getElementById('pageName').textContent = `Meeting — ${data.adoptee_name}`;
    document.getElementById('details').innerHTML = [
      ['Adoptee Type', data.adoptee_type],
      ['Date', data.meeting_date || 'TBD'],
      ['Time', data.meeting_time || 'TBD'],
      ['Moderator', data.moderator_name],
      ['Moderator Email', data.moderator_email],
      ['Notes', data.notes || '-']
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
