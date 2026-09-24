checkGuardianAccess();

const AE_ID = window.location.pathname.split('/').pop();

const typeSelect = document.getElementById('adoptee_type');
const elderlyFields = document.getElementById('elderlyFields');
const childFields = document.getElementById('childFields');
const professionInput = document.getElementById('profession');
const professionLabel = document.getElementById('professionLabel');

typeSelect.addEventListener('change', () => {
  const type = typeSelect.value;
  elderlyFields.style.display = type === 'elderly' ? 'block' : 'none';
  childFields.style.display = type === 'child' ? 'block' : 'none';
  professionInput.required = type === 'elderly';
  professionLabel.textContent = type === 'elderly' ? 'Profession' : 'Profession (optional)';
  document.getElementById('nid_no').required = type === 'elderly';
  document.getElementById('phone').required = type === 'elderly';
  document.getElementById('birth_cert').required = type === 'child';
});

// Pre-fill the form with what's already saved — the guardian only needs
// to fix whatever caused the rejection, not retype everything.
async function loadExisting() {
  const messageBox = document.getElementById('message');
  try {
    const res = await fetch(`/api/legal-guardian/adoptees/${AE_ID}`);
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not load this enlistment.';
      return;
    }

    if (data.verification_status !== 'rejected') {
      messageBox.className = 'message error';
      messageBox.textContent = 'This enlistment is not currently rejected, so it cannot be edited here.';
      document.getElementById('reapplyForm').style.display = 'none';
      return;
    }

    typeSelect.value = data.adoptee_type;
    typeSelect.dispatchEvent(new Event('change'));
    document.getElementById('name').value = data.name || '';
    document.getElementById('dob').value = data.dob || '';
    document.getElementById('gender').value = data.gender || '';
    document.getElementById('religion').value = data.religion || '';
    document.getElementById('profession').value = data.profession || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('house_no').value = data.house_no || '';
    document.getElementById('street').value = data.street || '';
    document.getElementById('zipcode').value = data.zipcode || '';
    document.getElementById('city_village').value = data.city_village || '';
    document.getElementById('district').value = data.district || '';
    // NID / phone / birth certificate / special needs / medical record
    // aren't pre-filled — they live in a separate subtype table we don't
    // fetch here, so the guardian re-enters just those few fields.

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
}

document.getElementById('reapplyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const messageBox = document.getElementById('message');

  const payload = {
    AE_ID: Number(AE_ID),
    adoptee_type: typeSelect.value,
    name: document.getElementById('name').value,
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    religion: document.getElementById('religion').value,
    profession: document.getElementById('profession').value,
    email: document.getElementById('email').value,
    house_no: document.getElementById('house_no').value,
    street: document.getElementById('street').value,
    zipcode: document.getElementById('zipcode').value,
    city_village: document.getElementById('city_village').value,
    district: document.getElementById('district').value,
    nid_no: document.getElementById('nid_no').value,
    phone: document.getElementById('phone').value,
    prev_med_record: document.getElementById('prev_med_record').value,
    profession_history: document.getElementById('profession_history').value,
    birth_cert: document.getElementById('birth_cert').value,
    special_needs: document.getElementById('special_needs').value
  };

  try {
    const res = await fetch('/api/legal-guardian/adoptees/reapply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Could not resubmit.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message + ' Redirecting...';
    setTimeout(() => window.location.href = '/guardian-pending-enlistment.html', 1200);

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});

loadExisting();
