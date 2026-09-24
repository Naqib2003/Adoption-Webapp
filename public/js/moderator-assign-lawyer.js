checkModeratorAccess().then(data => { if (data) init(); });

const params = new URLSearchParams(window.location.search);
let application_id = params.get('application_id');

async function init() {
  if (application_id) {
    // Guided mode — arrived with a case already chosen
    await loadContext();
    loadLawyers();
  } else {
    // Direct mode — moderator opened this tab from the nav, needs to pick a case first
    document.getElementById('pickerSection').style.display = 'block';
    document.getElementById('contextLine').textContent = 'No case selected yet — choose one below, then pick a lawyer.';
    await loadCaseOptions();
    loadLawyers();
  }
}

async function loadContext() {
  const res = await fetch(`/api/moderator/adoptees/${application_id}`);
  const data = await res.json();
  if (res.ok) {
    document.getElementById('contextLine').textContent = `Assigning a lawyer for: ${data.adoptee_name} (${data.adoptee_type})`;
  }
}

async function loadCaseOptions() {
  const res = await fetch('/api/moderator/adoptees');
  const data = await res.json();
  const select = document.getElementById('caseSelect');
  const eligible = data.filter(c => c.status === 'pending_moderator');

  if (eligible.length === 0) {
    select.innerHTML = '<option value="">No cases need a lawyer right now</option>';
    return;
  }

  select.innerHTML = '<option value="">Select a case...</option>' +
    eligible.map(c => `<option value="${c.application_id}">${c.adoptee_name} (${c.adoptee_type})</option>`).join('');

  select.addEventListener('change', () => {
    application_id = select.value;
  });
}

async function loadLawyers() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/moderator/lawyers');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load lawyers.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No free lawyers available right now.</p>';
      return;
    }

    list.innerHTML = data.map(l => `
      <div class="profile-row" style="cursor:pointer;" onclick="selectLawyer(${l.LE_ID})">
        <span><strong>${l.name}</strong></span>
        <span>${l.email}</span>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

function selectLawyer(LE_ID) {
  const messageBox = document.getElementById('message');
  if (!application_id) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Pick an adoptee case first.';
    return;
  }
  window.location.href = `/moderator/lawyer/${LE_ID}?application_id=${application_id}`;
}
