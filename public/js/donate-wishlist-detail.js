const item_id = window.location.pathname.split('/').pop();
let isAdopter = false;

async function init() {
  await checkWhoAmI();
  await loadDetail();
}

async function checkWhoAmI() {
  try {
    const res = await fetch('/api/donations/whoami');
    const data = await res.json();
    isAdopter = data.isAdopter;
    if (isAdopter) {
      document.getElementById('donatingAsLine').style.display = 'block';
      document.getElementById('donatingAsLine').textContent = `Providing as: ${data.name}`;
    } else {
      document.getElementById('guestFields').style.display = 'block';
    }
  } catch (err) {
    document.getElementById('guestFields').style.display = 'block';
  }
}

async function loadDetail() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/donations/wishlist/${item_id}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'This request is not available.';
      return;
    }

    document.getElementById('pageName').textContent = `${data.adoptee_name}'s Need`;
    document.getElementById('details').innerHTML = [
      ['Adoptee Type', data.adoptee_type],
      ['Description', data.description],
      ['Guardian', data.guardian_name],
      ['Status', data.status]
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    if (data.status !== 'needed') {
      document.getElementById('fulfillForm').style.display = 'none';
      messageBox.className = 'message success';
      messageBox.textContent = 'This need has already been fulfilled — thank you!';
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

document.getElementById('fulfillForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');

  const payload = { item_id: Number(item_id) };
  if (!isAdopter) {
    payload.guest_name = document.getElementById('guest_name').value;
    payload.guest_email = document.getElementById('guest_email').value;
    payload.guest_phone = document.getElementById('guest_phone').value;
  }

  try {
    const res = await fetch('/api/donations/fulfill-wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not process this.';
      return;
    }

    document.getElementById('fulfillForm').style.display = 'none';
    messageBox.className = 'message success';
    messageBox.textContent = `${data.message} Your Donation ID: ${data.donation_id}`;

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

init();
