checkGuardianAccess();

const application_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/legal-guardian/applications/${application_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this applicant.';
      return;
    }

    document.getElementById('pageName').textContent = data.adopter_name;
    document.getElementById('contextLine').textContent = `Applying for: ${data.adoptee_name} (${data.adoptee_type})`;

    // Police report — highlighted, since this is meant to directly inform
    // the guardian's decision
    if (data.policeReport) {
      document.getElementById('reportBox').style.display = 'block';
      document.getElementById('reportText').textContent = data.policeReport;
    }

    const experienceValue = data.has_prior_adoption_experience
      ? `Yes — ${data.prior_adoption_experience_description || '(no description given)'}`
      : 'No';

    document.getElementById('details').innerHTML = [
      ['Email', data.adopter_email],
      ['NID No.', data.nid_no],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Religion', data.religion || '-'],
      ['Profession', data.profession || '-'],
      ['Age', data.age || '-'],
      ['Phone', data.phone || '-'],
      ['Address', [data.house_no, data.street, data.zipcode, data.city_village, data.district].filter(Boolean).join(', ') || '-'],
      ['Previous Adoption Experience', experienceValue]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    // Spouse section — only shown if a spouse record actually exists
    if (data.s_name) {
      document.getElementById('spouseHeading').style.display = 'block';
      document.getElementById('spouseDetails').innerHTML = [
        ['Spouse Name', data.s_name],
        ['Spouse NID No.', data.s_nid],
        ['Spouse Date of Birth', data.s_dob || '-'],
        ['Spouse Phone', data.spouse_phone || '-'],
        ['Spouse Gender', data.spouse_gender || '-'],
        ['Spouse Religion', data.spouse_religion || '-'],
        ['Spouse Profession', data.spouse_profession || '-']
      ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');
    }

    if (data.status === 'pending_guardian') {
      document.getElementById('actions').innerHTML = `
        <button onclick="decide('favorite')" style="background:#2f6b4f;">Select as Favorite</button>
        <button onclick="decide('reject')" style="background:#b3261e;">Reject</button>
      `;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

async function decide(action) {
  const messageBox = document.getElementById('message');
  const url = action === 'favorite'
    ? '/api/legal-guardian/applications/select-favorite'
    : '/api/legal-guardian/applications/reject';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: Number(application_id) })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Action failed.';
      return;
    }

    window.location.href = '/guardian-new-request.html';
  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
