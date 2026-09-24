loadMoneyListings();
loadWishlist();

async function loadMoneyListings() {
  const list = document.getElementById('moneyList');
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/donations/eligible-adoptees');
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load donation listings.';
      return;
    }

    if (data.length === 0) {
      list.innerHTML = '<p class="subtitle">No one is currently accepting monetary donations.</p>';
      return;
    }

    list.innerHTML = data.map(a => {
      const pct = a.goal_amount ? Math.min(100, Math.round((a.raised_amount / a.goal_amount) * 100)) : null;
      return `
        <div class="profile-row" style="cursor:pointer; flex-direction:column; align-items:stretch;" onclick="window.location.href='/donate/money/${a.AE_ID}'">
          <div style="display:flex; justify-content:space-between;">
            <span><strong>${a.name}</strong> (${a.adoptee_type}, age ${a.age || '-'})</span>
            <span style="color:#6b7a72; font-size:12px;">${a.reason || ''}</span>
          </div>
          ${pct !== null ? `
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;"></div></div>
            <div class="progress-label">৳${a.raised_amount} raised of ৳${a.goal_amount} goal</div>
          ` : `<div class="progress-label">৳${a.raised_amount} raised so far</div>`}
        </div>
      `;
    }).join('');

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

async function loadWishlist() {
  const list = document.getElementById('wishlistList');

  try {
    const res = await fetch('/api/donations/wishlist');
    const data = await res.json();

    if (!res.ok || data.length === 0) {
      list.innerHTML = '<p class="subtitle">No current needs listed.</p>';
      return;
    }

    list.innerHTML = data.map(w => `
      <div class="profile-row" style="cursor:pointer;" onclick="window.location.href='/donate/wishlist/${w.item_id}'">
        <span><strong>${w.adoptee_name}</strong> (${w.adoptee_type})</span>
        <span style="color:#6b7a72; font-size:12px;">${w.description}</span>
      </div>
    `).join('');

  } catch (err) {
    list.innerHTML = '<p class="subtitle">Could not load wishlist.</p>';
  }
}
