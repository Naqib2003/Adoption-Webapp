checkAdopterAccess().then(data => {
  if (data) loadAvailable();
});

async function loadAvailable() {
  const suggestedList = document.getElementById('suggestedList');
  const otherList = document.getElementById('otherList');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/adopter/adoptees/available');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load listings.';
      return;
    }

    suggestedList.innerHTML = data.suggested.length
      ? data.suggested.map(renderRow).join('')
      : '<p class="subtitle">No suggestions available right now.</p>';

    otherList.innerHTML = data.others.length
      ? data.others.map(renderRow).join('')
      : '<p class="subtitle">No other adoptees available right now.</p>';

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

function renderRow(a) {
  return `
    <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/adoptee/${a.AE_ID}'">
      <span><strong>${a.name}</strong> (${a.adoptee_type})</span>
      <span>${a.gender}, age ${a.age || '-'}</span>
    </div>
  `;
}
