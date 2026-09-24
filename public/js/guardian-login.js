document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/legal-guardian/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Login failed.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = 'Logged in! Redirecting...';
    setTimeout(() => {
      if (data.verification_status === 'verified') {
        window.location.href = 'guardian-home.html';
      } else {
        window.location.href = 'guardian-profile.html';
      }
    }, 1000);

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server. Is it running?';
  }
});
