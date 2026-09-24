checkGuardianAccess();

async function loadPending() {
  const list = document.getElementById('list');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/legal-guardian/adoptees/pending');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load pending enlistments.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No pending enlistments.</p>';
      return;
    }

    list.innerHTML = data.map(a => {
      const isRejected = a.verification_status === 'rejected';
      const link = isRejected
        ? `/guardian/adoptee-reapply/${a.AE_ID}`
        : `/guardian/adoptee/${a.AE_ID}`;
      return `
        <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='${link}'">
          <span><strong>${a.name}</strong> (${a.adoptee_type})</span>
          <span class="status-badge status-${isRejected ? 'rejected' : 'pending'}">
            ${isRejected ? 'rejected — click to edit & resubmit' : 'pending'}
          </span>
        </div>
      `;
    }).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

loadPending();
