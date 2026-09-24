// Deliberately minimal — moderators aren't created through any public
// route, so there's no signup logic here at all, just enough to support
// login and (later) reading their own info.
const db = require('../../config/db');

const Moderator = {
  findById: async (M_ID) => {
    const [rows] = await db.query('SELECT * FROM moderator_info WHERE M_ID = ?', [M_ID]);
    return rows[0];
  }
};

module.exports = Moderator;
