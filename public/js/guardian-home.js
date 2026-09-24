checkGuardianAccess().then(data => {
  if (data) {
    document.getElementById('greeting').textContent = `Hello, ${data.name}!`;
  }
});
