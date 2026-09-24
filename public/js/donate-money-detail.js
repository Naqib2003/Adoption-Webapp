const AE_ID = window.location.pathname.split('/').pop();
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
      document.getElementById('donatingAsLine').textContent = `Donating as: ${data.name}`;
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
    const res = await fetch(`/api/donations/eligible-adoptees/${AE_ID}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'This listing is not available.';
      return;
    }

    document.getElementById('pageName').textContent = data.name;
    document.getElementById('details').innerHTML = [
      ['Type', data.adoptee_type],
      ['Age', data.age || '-'],
      ['Gender', data.gender],
      ['Guardian', data.guardian_name],
      ['Reason', data.reason || '-']
    ].map(([label, value]) => `<div class="profile-row"><span>${label}</span><span>${value}</span></div>`).join('');

    if (data.goal_amount) {
      const pct = Math.min(100, Math.round((data.raised_amount / data.goal_amount) * 100));
      document.getElementById('details').innerHTML += `
        <div style="margin-top:16px;">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;"></div></div>
          <div class="progress-label">৳${data.raised_amount} raised of ৳${data.goal_amount} goal (${pct}%)</div>
        </div>
      `;
    } else {
      document.getElementById('details').innerHTML += `<div class="progress-label" style="margin-top:16px;">৳${data.raised_amount} raised so far</div>`;
    }

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

document.querySelectorAll('.amountBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('amount').value = btn.dataset.amount;
  });
});

document.getElementById('donateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');
  const amount = document.getElementById('amount').value;

  if (!amount || Number(amount) <= 0) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Please enter a valid amount.';
    return;
  }

  const payload = { AE_ID: Number(AE_ID), amount: Number(amount) };
  if (!isAdopter) {
    payload.guest_name = document.getElementById('guest_name').value;
    payload.guest_email = document.getElementById('guest_email').value;
    payload.guest_phone = document.getElementById('guest_phone').value;
  }

  try {
    const res = await fetch('/api/donations/donate-money', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not process donation.';
      return;
    }

    document.getElementById('donateForm').style.display = 'none';
    messageBox.className = 'message success';
    messageBox.textContent = `${data.message} Your Donation ID: ${data.donation_id}`;

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

init();
