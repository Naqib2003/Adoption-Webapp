checkGuardianAccess();

async function loadRequests() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');
  messageBox.className = 'message';
  messageBox.textContent = '';

  try {
    const res = await fetch('/api/legal-guardian/applications/new-requests');
    const groups = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = groups.error || 'Could not load requests.';
      return;
    }

    if (groups.length === 0) {
      list.innerHTML = '<p class="subtitle">No pending requests.</p>';
      return;
    }

    list.innerHTML = groups.map(g => `
      <div style="border:1px solid #eee; border-radius:8px; padding:16px; margin-bottom:16px;">
        <strong>${g.adoptee_name}</strong> (${g.adoptee_type}) — ${g.applicants.length} applicant(s)
        ${g.applicants.map(a => `
          <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/guardian/applicant/${a.application_id}'">
            <span>${a.adopter_name}</span>
            <span style="display:flex; align-items:center; gap:8px;">
              <span class="status-badge ${a.has_prior_adoption_experience ? 'status-verified' : ''}">
                Prior experience: ${a.has_prior_adoption_experience ? 'Yes' : 'No'}
              </span>
              <span style="color:#6b7a72; font-size:12px;">${a.adopter_email}</span>
            </span>
          </div>
        `).join('')}
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadRequests();
