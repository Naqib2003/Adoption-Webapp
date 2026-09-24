checkModeratorAccess();

const application_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/moderator/adoptees/${application_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this case.';
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
      ['Status', data.status]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    if (data.status === 'pending_moderator') {
      document.getElementById('actions').innerHTML = `
        <button onclick="assign()">Assign Lawyer</button>
      `;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

function assign() {
  // Carry this case's context forward via query string — the Assign Lawyer
  // tab pre-fills using this instead of asking the moderator to pick again.
  window.location.href = `/moderator-assign-lawyer.html?application_id=${application_id}`;
}

loadDetail();
