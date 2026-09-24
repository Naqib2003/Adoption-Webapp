// The id is the last segment of the URL path, e.g. /adoptee/7 -> "7"
const AE_ID = window.location.pathname.split('/').pop();

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/adopter/adoptees/${AE_ID}`);

    if (res.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    if (res.status === 403) {
      window.location.href = '/profile.html';
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this profile.';
      return;
    }

    document.getElementById('pageName').textContent = data.name;
    document.getElementById('details').innerHTML = [
      ['Type', data.adoptee_type],
      ['Date of Birth', data.dob],
      ['Gender', data.gender],
      ['Age', data.age || '-'],
      ['Religion', data.religion || '-'],
      ['Profession', data.profession || '-']
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    // No compatibility score, percent, or breakdown shown here anymore —
    // that matching logic runs entirely server-side now and never
    // reaches the frontend at all.

    if (data.alreadyApplied) {
      document.getElementById('actions').innerHTML =
        `<button disabled style="background:#b8bfba; cursor:not-allowed;">Already Applied</button>`;
    } else {
      document.getElementById('actions').innerHTML = `<button onclick="apply()">Apply to Adopt</button>`;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

async function apply() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch('/api/adopter/applications/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ AE_ID: Number(AE_ID) })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not submit application.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message;
    document.getElementById('actions').innerHTML =
      `<button disabled style="background:#b8bfba; cursor:not-allowed;">Already Applied</button>`;

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadDetail();
