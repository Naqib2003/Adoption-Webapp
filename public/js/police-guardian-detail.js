const LG_ID = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/police/guardians/${LG_ID}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this profile.';
      return;
    }

    document.getElementById('pageName').textContent = data.name;
    document.getElementById('details').innerHTML = [
      ['Email', data.email],
      ['NID No.', data.nid_no],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Religion', data.religion || '-'],
      ['Profession', data.profession || '-'],
      ['Age', data.age || '-'],
      ['Address', [data.house_no, data.street, data.zipcode, data.city_village, data.district].filter(Boolean).join(', ') || '-']
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    if (data.verification_status === 'pending') {
      document.getElementById('actions').innerHTML = `
        <label>Report (required before you can verify or reject)</label>
        <textarea id="reportText" rows="4" style="width:100%; padding:10px; border:1px solid #d7ddda; border-radius:8px; font-family:inherit; font-size:14px;">${data.existingReport || ''}</textarea>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <button onclick="verify('verified')" style="background:#2f6b4f;">Approve</button>
          <button onclick="verify('rejected')" style="background:#b3261e;">Reject</button>
        </div>
      `;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

async function verify(status) {
  const messageBox = document.getElementById('message');
  const report = document.getElementById('reportText').value;

  if (!report.trim()) {
    messageBox.className = 'message error';
    messageBox.textContent = 'A report is required before you can verify or reject this legal guardian.';
    return;
  }

  try {
    const res = await fetch('/api/police/verify-guardian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ LG_ID: Number(LG_ID), status, report })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Action failed.';
      return;
    }

    window.location.href = '/police-verify-guardian.html';
  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
