document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
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
      if (data.role === 'adopter') {
        window.location.href = data.verification_status === 'verified' ? '/adopter-home.html' : '/profile.html';
      } else if (data.role === 'legalGuardian') {
        window.location.href = data.verification_status === 'verified' ? '/guardian-home.html' : '/guardian-profile.html';
      } else if (data.role === 'police') {
        window.location.href = '/police-verify-adopter.html';
      } else if (data.role === 'lawyer') {
        window.location.href = '/lawyer-meetings.html';
      } else if (data.role === 'moderator') {
        window.location.href = '/moderator-adoptees.html';
      } else {
        window.location.href = '/index.html';
      }
    }, 1000);

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server. Is it running?';
  }
});
