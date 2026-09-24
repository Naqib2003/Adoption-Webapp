checkGuardianAccess().then(data => { if (data) loadGuardianAddress(); });

const typeSelect = document.getElementById('adoptee_type');
const elderlyFields = document.getElementById('elderlyFields');
const childFields = document.getElementById('childFields');
const professionInput = document.getElementById('profession');
const professionLabel = document.getElementById('professionLabel');
const useGuardianAddress = document.getElementById('use_guardian_address');
const addressIds = ['house_no', 'street', 'zipcode', 'city_village', 'district'];

let guardianAddress = null;

// ---- Type-dependent required fields ----
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

// ---- Address auto-fill from the guardian's own address ----
async function loadGuardianAddress() {
  try {
    const res = await fetch('/api/legal-guardian/profile');
    if (!res.ok) return;
    const data = await res.json();
    guardianAddress = data.address || {};
    applyGuardianAddress();
  } catch (err) {
    setAddressDisabled(false);
  }
}

function applyGuardianAddress() {
  addressIds.forEach(id => {
    document.getElementById(id).value = (guardianAddress && guardianAddress[id]) || '';
  });
  setAddressDisabled(true);
}

function setAddressDisabled(disabled) {
  addressIds.forEach(id => {
    const el = document.getElementById(id);
    el.disabled = disabled;
    el.style.background = disabled ? '#f0f0f0' : '';
  });
}

useGuardianAddress.addEventListener('change', () => {
  if (useGuardianAddress.checked) {
    applyGuardianAddress();
  } else {
    addressIds.forEach(id => { document.getElementById(id).value = ''; });
    setAddressDisabled(false);
  }
});

// ---- Submit ----
document.getElementById('enlistForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // No "age" field anywhere — the server calculates it from dob.
  const payload = {
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

  const messageBox = document.getElementById('message');

  try {
    const res = await fetch('/api/legal-guardian/adoptees/enlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Enlistment failed.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = data.message;
    document.getElementById('enlistForm').reset();
    elderlyFields.style.display = 'none';
    childFields.style.display = 'none';
    useGuardianAddress.checked = true;
    applyGuardianAddress();

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});
