checkGuardianAccess();

const AE_ID = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/legal-guardian/adoptees/${AE_ID}`);

    if (res.status === 401) { window.location.href = '/guardian-login.html'; return; }
    if (res.status === 403) { window.location.href = '/guardian-profile.html'; return; }

    const data = await res.json();
    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this profile.';
      return;
    }

    document.getElementById('pageName').textContent = data.name;

    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = data.verification_status;
    statusBadge.className = 'status-badge status-' + data.verification_status;

    const backLink = document.getElementById('backLink');
    if (data.verification_status === 'pending') {
      backLink.href = '/guardian-pending-enlistment.html';
    } else if (data.adoptee_type === 'child') {
      backLink.href = '/guardian-enlisted-children.html';
    } else {
      backLink.href = '/guardian-enlisted-elder.html';
    }

    document.getElementById('details').innerHTML = [
      ['Type', data.adoptee_type],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Age', data.age || '-'],
      ['Religion', data.religion || '-'],
      ['Profession', data.profession || '-'],
      ['Email', data.email || '-'],
      ['Adoption Status', data.status]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    // Manage Donations is only available while the adoptee is verified AND
    // NOT yet placed with an adopter. Once fully adopted, donation
    // management stops — the adoptee still shows here permanently for the
    // guardian's own records, but this button disappears for good.
    if (data.verification_status === 'verified' && data.status !== 'placed') {
      document.getElementById('actions').innerHTML =
        `<button onclick="window.location.href='/guardian/donation-settings/${AE_ID}'">Manage Donations</button>`;
    } else if (data.status === 'placed') {
      document.getElementById('actions').innerHTML =
        `<p class="subtitle">This adoptee has been successfully adopted. Donation management is no longer available.</p>`;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
