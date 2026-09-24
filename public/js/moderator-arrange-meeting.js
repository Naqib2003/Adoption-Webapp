checkModeratorAccess().then(data => { if (data) init(); });

const params = new URLSearchParams(window.location.search);
let application_id = params.get('application_id');
let lawyer_id = params.get('lawyer_id');

async function init() {
  if (application_id && lawyer_id) {
    // Fully guided — both already chosen via the click-through flow
    const [caseRes, lawyerRes] = await Promise.all([
      fetch(`/api/moderator/adoptees/${application_id}`),
      fetch(`/api/moderator/lawyers/${lawyer_id}`)
    ]);
    const caseData = await caseRes.json();
    const lawyerData = await lawyerRes.json();
    if (caseRes.ok && lawyerRes.ok) {
      document.getElementById('contextLine').textContent =
        `Arranging a meeting for ${caseData.adoptee_name} with lawyer ${lawyerData.name}.`;
    }
  } else {
    // Direct access — show manual pickers for both
    document.getElementById('pickerSection').style.display = 'block';
    document.getElementById('contextLine').textContent = 'Pick a case and a lawyer manually.';
    await loadCaseOptions();
    await loadLawyerOptions();
  }
}

async function loadCaseOptions() {
  const res = await fetch('/api/moderator/adoptees');
  const data = await res.json();
  const select = document.getElementById('caseSelect');
  const eligible = data.filter(c => c.status === 'pending_moderator');

  select.innerHTML = eligible.length
    ? '<option value="">Select a case...</option>' + eligible.map(c => `<option value="${c.application_id}">${c.adoptee_name} (${c.adoptee_type})</option>`).join('')
    : '<option value="">No cases need a lawyer right now</option>';

  select.addEventListener('change', () => { application_id = select.value; });
}

async function loadLawyerOptions() {
  const res = await fetch('/api/moderator/lawyers');
  const data = await res.json();
  const select = document.getElementById('lawyerSelect');

  select.innerHTML = data.length
    ? '<option value="">Select a lawyer...</option>' + data.map(l => `<option value="${l.LE_ID}">${l.name}</option>`).join('')
    : '<option value="">No free lawyers available</option>';

  select.addEventListener('change', () => { lawyer_id = select.value; });
}

document.getElementById('meetingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');

  if (!application_id || !lawyer_id) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Please select both a case and a lawyer.';
    return;
  }

  try {
    const res = await fetch('/api/moderator/arrange-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id,
        LE_ID: lawyer_id,
        meeting_date: document.getElementById('meeting_date').value,
        meeting_time: document.getElementById('meeting_time').value,
        notes: document.getElementById('notes').value
      })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not arrange meeting.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message + ' Redirecting...';
    setTimeout(() => window.location.href = '/moderator-adoptees.html', 1200);

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});
