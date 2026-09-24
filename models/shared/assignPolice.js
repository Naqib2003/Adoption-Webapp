// Shared by Adopter and Legal Guardian signup: picks whichever Police
// account currently has the FEWEST pending assigned cases, so new
// requests get spread out evenly instead of piling onto one officer.
const db = require('../../config/db');

async function getLeastLoadedPoliceId() {
  const [rows] = await db.query(`
    SELECT le.LE_ID,
      (SELECT COUNT(*) FROM adopter_info a
         WHERE a.assigned_police_LE_ID = le.LE_ID AND a.verification_status = 'pending') +
      (SELECT COUNT(*) FROM guardian_info g
         WHERE g.assigned_police_LE_ID = le.LE_ID AND g.verification_status = 'pending') +
      (SELECT COUNT(*) FROM adoptee_info ad
         WHERE ad.assigned_police_LE_ID = le.LE_ID AND ad.verification_status = 'pending') AS pending_count
    FROM legalentity_info le
    WHERE le.entity_type = 'police'
    ORDER BY pending_count ASC, le.LE_ID ASC
    LIMIT 1
  `);
  // If no police accounts exist yet, this returns null — the profile is
  // created but stays unassigned until at least one police account signs up.
  return rows.length ? rows[0].LE_ID : null;
}

module.exports = { getLeastLoadedPoliceId };
