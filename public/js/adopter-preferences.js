async function loadPreferences() {
  const res = await fetch('/api/adopter/preferences');
  if (!res.ok) return;
  const data = await res.json();

  document.getElementById('preferred_age_min').value = data.preferred_age_min || '';
  document.getElementById('preferred_age_max').value = data.preferred_age_max || '';
  document.getElementById('preferred_gender').value = data.preferred_gender || 'any';
  document.getElementById('preferred_religion').value = data.preferred_religion || '';
  document.getElementById('open_to_special_needs').checked = !!data.open_to_special_needs;
}

document.getElementById('prefsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/adopter/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferred_age_min: document.getElementById('preferred_age_min').value || null,
        preferred_age_max: document.getElementById('preferred_age_max').value || null,
        preferred_gender: document.getElementById('preferred_gender').value,
        preferred_religion: document.getElementById('preferred_religion').value || null,
        open_to_special_needs: document.getElementById('open_to_special_needs').checked
      })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not save preferences.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message;
  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

loadPreferences();
