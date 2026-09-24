const accountTypeSelect = document.getElementById('account_type');
const entityTypeField = document.getElementById('entityTypeField');
const entityTypeSelect = document.getElementById('entity_type');
const adopterGuardianFields = document.getElementById('adopterGuardianFields');
const spouseSection = document.getElementById('spouseSection');
const hasSpouseCheckbox = document.getElementById('has_spouse');
const spouseFields = document.getElementById('spouseFields');
const priorExperienceSection = document.getElementById('priorExperienceSection');
const priorExperienceDescriptionField = document.getElementById('priorExperienceDescriptionField');
const badgeField = document.getElementById('badgeField');
const licenseField = document.getElementById('licenseField');

function setRequired(id, isRequired) {
  const el = document.getElementById(id);
  if (el) el.required = isRequired;
}

// Which whole section shows, based on account type. IMPORTANT: hiding a
// section with display:none does NOT reliably exempt its fields from
// required-field validation in every case — Chrome can still try to
// validate a hidden required field, fail to focus it to show the error,
// and silently block the whole form with zero visible feedback. So every
// field that's conditionally required gets its `required` property
// explicitly toggled here, not left to hiding alone.
accountTypeSelect.addEventListener('change', () => {
  const type = accountTypeSelect.value;

  entityTypeField.style.display = type === 'legalEntity' ? 'block' : 'none';
  adopterGuardianFields.style.display = (type === 'adopter' || type === 'legalGuardian') ? 'block' : 'none';

  // Spouse only makes sense for Adopter — adopter_spouse is an
  // Adopter-only table, Legal Guardian has no equivalent.
  spouseSection.style.display = type === 'adopter' ? 'block' : 'none';
  if (type !== 'adopter') {
    hasSpouseCheckbox.checked = false;
    spouseFields.style.display = 'none';
    setRequired('s_name', false);
    setRequired('s_nid', false);
  }

  // Prior adoption experience — Adopter only
  priorExperienceSection.style.display = type === 'adopter' ? 'block' : 'none';
  if (type !== 'adopter') {
    document.querySelector('input[name="has_prior_adoption_experience"][value="no"]').checked = true;
    priorExperienceDescriptionField.style.display = 'none';
    setRequired('prior_adoption_experience_description', false);
  }

  const needsAdopterGuardianFields = (type === 'adopter' || type === 'legalGuardian');
  ['religion', 'profession', 'house_no', 'street', 'city_village', 'district']
    .forEach(id => setRequired(id, needsAdopterGuardianFields));

  if (type !== 'legalEntity') {
    entityTypeSelect.value = '';
    badgeField.style.display = 'none';
    licenseField.style.display = 'none';
    setRequired('badge_no', false);
    setRequired('license_no', false);
  }
});

// Second-level reveal: within Legal Entity, Police vs Lawyer sub-fields
entityTypeSelect.addEventListener('change', () => {
  const isPolice = entityTypeSelect.value === 'police';
  const isLawyer = entityTypeSelect.value === 'lawyer';
  badgeField.style.display = isPolice ? 'block' : 'none';
  licenseField.style.display = isLawyer ? 'block' : 'none';
  setRequired('badge_no', isPolice);
  setRequired('license_no', isLawyer);
});

// Spouse fields only appear once the "add spouse" checkbox is ticked.
// Name + NID become required only in that case, since NID is the spouse
// table's primary key and can't be left blank if a record IS being created.
hasSpouseCheckbox.addEventListener('change', () => {
  const checked = hasSpouseCheckbox.checked;
  spouseFields.style.display = checked ? 'block' : 'none';
  setRequired('s_name', checked);
  setRequired('s_nid', checked);
});

// Prior adoption experience description only required if "Yes" is picked
document.querySelectorAll('input[name="has_prior_adoption_experience"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const isYes = document.querySelector('input[name="has_prior_adoption_experience"]:checked').value === 'yes';
    priorExperienceDescriptionField.style.display = isYes ? 'block' : 'none';
    setRequired('prior_adoption_experience_description', isYes);
  });
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const messageBox = document.getElementById('message');
  const type = accountTypeSelect.value;

  if (!type) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Please select an account type.';
    return;
  }

  // No "age" field anywhere — the server calculates it from dob.
  const common = {
    username: document.getElementById('username').value,
    name: document.getElementById('name').value,
    nid_no: document.getElementById('nid_no').value,
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  let endpoint, payload;

  if (type === 'adopter' || type === 'legalGuardian') {
    endpoint = type === 'adopter' ? '/api/adopter/signup' : '/api/legal-guardian/signup';
    payload = {
      ...common,
      religion: document.getElementById('religion').value,
      profession: document.getElementById('profession').value,
      phone: document.getElementById('phone').value,
      house_no: document.getElementById('house_no').value,
      street: document.getElementById('street').value,
      zipcode: document.getElementById('zipcode').value,
      city_village: document.getElementById('city_village').value,
      district: document.getElementById('district').value
    };

    // Spouse info — Adopter only, and only if the checkbox was ticked
    if (type === 'adopter' && hasSpouseCheckbox.checked) {
      payload.s_name = document.getElementById('s_name').value;
      payload.s_nid = document.getElementById('s_nid').value;
      payload.s_dob = document.getElementById('s_dob').value;
      payload.s_phone = document.getElementById('s_phone').value;
      payload.s_gender = document.getElementById('s_gender').value;
      payload.s_religion = document.getElementById('s_religion').value;
      payload.s_profession = document.getElementById('s_profession').value;
    }

    // Prior adoption experience — Adopter only
    if (type === 'adopter') {
      const isYes = document.querySelector('input[name="has_prior_adoption_experience"]:checked').value === 'yes';
      payload.has_prior_adoption_experience = isYes;
      payload.prior_adoption_experience_description = isYes
        ? document.getElementById('prior_adoption_experience_description').value
        : null;
    }
  } else if (type === 'legalEntity') {
    if (!entityTypeSelect.value) {
      messageBox.className = 'message error';
      messageBox.textContent = 'Please select Police or Lawyer.';
      return;
    }
    endpoint = '/api/legal-entity/signup';
    payload = {
      ...common,
      phone_no: document.getElementById('phone').value,
      entity_type: entityTypeSelect.value,
      badge_no: document.getElementById('badge_no').value,
      license_no: document.getElementById('license_no').value
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      messageBox.className = 'message error';
      messageBox.textContent = data.error || 'Registration failed.';
      return;
    }

    messageBox.className = 'message success';
    messageBox.textContent = (data.message || 'Account created.') + ' Redirecting...';

    setTimeout(() => {
      if (data.role === 'adopter') {
        window.location.href = '/profile.html';
      } else if (data.role === 'legalGuardian') {
        window.location.href = '/guardian-profile.html';
      } else if (data.role === 'police') {
        window.location.href = '/police-verify-adopter.html';
      } else {
        window.location.href = '/legalentity-profile.html';
      }
    }, 1200);

  } catch (err) {
    messageBox.className = 'message error';
    messageBox.textContent = 'Could not reach the server.';
  }
});
