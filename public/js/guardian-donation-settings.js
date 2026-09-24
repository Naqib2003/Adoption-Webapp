checkGuardianAccess();

const AE_ID = window.location.pathname.split('/').pop();
document.getElementById('backLink').href = `/guardian/adoptee/${AE_ID}`;

const allowCheckbox = document.getElementById('allow_donation');
const typeFields = document.getElementById('typeFields');
const needBasedCheckbox = document.getElementById('need_based_enabled');
const wishlistSection = document.getElementById('wishlistSection');
const settingsForm = document.getElementById('settingsForm');

allowCheckbox.addEventListener('change', () => {
  typeFields.style.display = allowCheckbox.checked ? 'block' : 'none';
  refreshWishlistVisibility();
});
needBasedCheckbox.addEventListener('change', refreshWishlistVisibility);

function refreshWishlistVisibility() {
  wishlistSection.style.display = (allowCheckbox.checked && needBasedCheckbox.checked) ? 'block' : 'none';
}

// Defense in depth: even though the button that leads here is already
// hidden once an adoptee is placed, this page checks directly too, in
// case someone reaches it via a saved link or typed URL.
async function checkNotPlaced() {
  const res = await fetch(`/api/legal-guardian/adoptees/${AE_ID}`);
  if (!res.ok) return true; // let loadSettings handle the error normally
  const data = await res.json();
  if (data.status === 'placed') {
    document.getElementById('lockedNotice').style.display = 'block';
    settingsForm.style.display = 'none';
    return false;
  }
  return true;
}

async function loadSettings() {
  const canEdit = await checkNotPlaced();
  if (!canEdit) return;

  const res = await fetch(`/api/legal-guardian/donations/settings/${AE_ID}`);
  const data = await res.json();
  if (!res.ok) return;

  allowCheckbox.checked = !!data.allow_donation;
  document.getElementById('money_enabled').checked = !!data.money_enabled;
  needBasedCheckbox.checked = !!data.need_based_enabled;
  document.getElementById('goal_amount').value = data.goal_amount || '';
  document.getElementById('reason').value = data.reason || '';

  typeFields.style.display = allowCheckbox.checked ? 'block' : 'none';
  refreshWishlistVisibility();

  if (allowCheckbox.checked && needBasedCheckbox.checked) {
    loadWishlist();
  }
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch(`/api/legal-guardian/donations/settings/${AE_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allow_donation: allowCheckbox.checked,
        money_enabled: document.getElementById('money_enabled').checked,
        need_based_enabled: needBasedCheckbox.checked,
        goal_amount: document.getElementById('goal_amount').value || null,
        reason: document.getElementById('reason').value
      })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not save settings.';
      if (res.status === 409) {
        document.getElementById('lockedNotice').style.display = 'block';
        settingsForm.style.display = 'none';
      }
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message;
    refreshWishlistVisibility();
    if (allowCheckbox.checked && needBasedCheckbox.checked) loadWishlist();

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

document.getElementById('wishlistForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');
  const description = document.getElementById('wishlistDescription').value;
  if (!description) return;

  try {
    const res = await fetch('/api/legal-guardian/donations/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ AE_ID: Number(AE_ID), description })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not add request.';
      return;
    }

    document.getElementById('wishlistDescription').value = '';
    loadWishlist();
  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

async function loadWishlist() {
  const res = await fetch('/api/legal-guardian/donations/wishlist');
  const data = await res.json();
  if (!res.ok) return;

  const forThisAdoptee = data.filter(item => item.AE_ID == AE_ID);
  const list = document.getElementById('wishlistList');

  if (forThisAdoptee.length === 0) {
    list.innerHTML = '<p class="subtitle">No requests yet.</p>';
    return;
  }

  list.innerHTML = forThisAdoptee.map(item => `
    <div class="profile-row">
      <span>${item.description}</span>
      <span class="status-badge status-${item.status === 'needed' ? 'pending' : 'verified'}">${item.status}</span>
    </div>
  `).join('');
}

loadSettings();
