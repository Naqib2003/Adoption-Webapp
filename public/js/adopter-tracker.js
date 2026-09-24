checkAdopterAccess().then(data => {
  if (data) loadApplications();
});

// The 4 "normal" stages every application passes through in order.
// A rejection at any point stops the flow right there instead of
// continuing through the remaining stages.
const STAGES = ['Applied', 'Guardian Review', 'Moderator', 'Lawyer Approval'];

function buildSteps(status) {
  // Map each status to how far along the 4 stages we are, and whether
  // it ended in rejection.
  const progressByStatus = {
    pending_guardian: 1,          // Applied is done, currently on Guardian Review
    rejected_by_guardian: 1,      // failed AT stage index 1 (Guardian Review)
    pending_moderator: 2,         // Guardian Review done, currently on Moderator
    pending_lawyer_approval: 3,   // Moderator done, currently on Lawyer Approval
    approved: 4,                  // everything done
    rejected_by_lawyer: 3         // failed AT stage index 3 (Lawyer Approval)
  };

  const failedStatuses = ['rejected_by_guardian', 'rejected_by_lawyer'];
  const isFailed = failedStatuses.includes(status);
  const progress = progressByStatus[status] ?? 0;

  return STAGES.map((label, index) => {
    let state;
    if (isFailed && index === progress) {
      state = 'failed';
    } else if (index < progress) {
      state = 'done';
    } else if (index === progress && !isFailed) {
      state = 'current';
    } else {
      state = 'future';
    }
    return { label, state };
  });
}

function renderSteps(status) {
  const steps = buildSteps(status);
  return `
    <div class="step-tracker">
      ${steps.map(s => `
        <div class="step step-${s.state}">
          <div class="step-circle">${s.state === 'done' ? '✓' : s.state === 'failed' ? '✕' : ''}</div>
          <div class="step-label">${s.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

const statusNote = {
  pending_guardian: 'Awaiting the guardian\'s review.',
  rejected_by_guardian: 'This application was not selected by the guardian.',
  pending_moderator: 'Accepted by the guardian — now with a moderator.',
  pending_lawyer_approval: 'A meeting has been arranged — awaiting the lawyer\'s decision.',
  approved: 'Adoption approved! 🎉',
  rejected_by_lawyer: 'The lawyer did not approve this adoption.'
};

async function loadApplications() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/adopter/applications/mine');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load applications.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">You have no active applications yet.</p>';
      return;
    }

    list.innerHTML = data.map(a => `
      <div class="tracker-card">
        <h3>${a.adoptee_name} (${a.adoptee_type})</h3>
        ${renderSteps(a.status)}
        <p class="subtitle" style="margin-top:16px; margin-bottom:0;">${statusNote[a.status] || ''}</p>
      </div>
    `).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}
