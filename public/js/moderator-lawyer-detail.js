checkModeratorAccess();

const LE_ID = window.location.pathname.split('/').pop();
const params = new URLSearchParams(window.location.search);
const application_id = params.get('application_id');

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/moderator/lawyers/${LE_ID}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this lawyer.';
      return;
    }

    document.getElementById('pageName').textContent = data.name;
    document.getElementById('details').innerHTML = [
      ['Email', data.email],
      ['Phone', data.phone_no || '-'],
      ['NID No.', data.nid_no],
      ['License No.', data.license_no]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    if (application_id) {
      document.getElementById('actions').innerHTML = `<button onclick="arrange()">Arrange Meeting</button>`;
    } else {
      document.getElementById('actions').innerHTML = `<p class="subtitle">No case selected — go back and pick one first.</p>`;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

function arrange() {
  window.location.href = `/moderator-arrange-meeting.html?application_id=${application_id}&lawyer_id=${LE_ID}`;
}

loadDetail();
