checkLawyerAccess();

const application_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/lawyer/approval-requests/${application_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this request.';
      return;
    }

    document.getElementById('pageName').textContent = data.adoptee_name;
    document.getElementById('details').innerHTML = [
      ['Type', data.adoptee_type],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Age', data.age || '-'],
      ['Religion', data.religion || '-'],
      ['Profession', data.profession || '-'],
      ['Applicant', data.adopter_name],
      ['Applicant Email', data.adopter_email]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    document.getElementById('actions').innerHTML = `
      <button onclick="decide('approved')" style="background:#2f6b4f;">Approve</button>
      <button onclick="decide('rejected')" style="background:#b3261e;">Reject</button>
    `;

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

async function decide(status) {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch('/api/lawyer/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: Number(application_id), status })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Action failed.';
      return;
    }

    window.location.href = '/lawyer-approval-requests.html';
  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
