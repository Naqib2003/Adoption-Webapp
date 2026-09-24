checkLawyerAccess();

const application_id = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/lawyer/approved/${application_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this record.';
      return;
    }

    document.getElementById('pageName').textContent = data.adoptee_name;
    document.getElementById('details').innerHTML = [
      ['Type', data.adoptee_type],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Age', data.age || '-'],
      ['Adopted by', data.adopter_name],
      ['Adopter Email', data.adopter_email],
      ['Approved on', data.decided_at]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
