const Adoptee = require('../../models/adoptee/adopteeModel');
const { getAdopterMatchProfile, scoreAdopteeForAdopter } = require('../../models/matching/matchModel');
const { Application } = require('../../models/application/applicationModel');

const browseController = {

  // GET /api/adopter/adoptees/available
  // Compatibility scoring happens entirely server-side and is used ONLY to
  // decide the split — the actual percent and the breakdown that produced
  // it never leave this function. The frontend gets two plain lists with
  // no scoring fields attached at all.
  getAvailable: async (req, res) => {
    try {
      const adoptees = await Adoptee.getAllAvailable();
      const adopterProfile = await getAdopterMatchProfile(req.session.userId);

      const scored = await Promise.all(adoptees.map(async (a) => {
        const score = await scoreAdopteeForAdopter(adopterProfile, a.AE_ID);
        return { ...a, _compatibilityPercent: score.compatibilityPercent };
      }));

      scored.sort((a, b) => b._compatibilityPercent - a._compatibilityPercent);

      const suggested = scored.slice(0, 2).map(stripScore);
      const others = scored.slice(2).map(stripScore);

      res.json({ suggested, others });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load listings.' });
    }
  },

  // GET /api/adopter/adoptees/:id — plain adoptee detail. No compatibility
  // score or breakdown attached anymore; that was only ever used to
  // render the removed on-page display, and computing it here would just
  // be extra work with no consumer.
  getById: async (req, res) => {
    try {
      const adoptee = await Adoptee.getAvailableById(req.params.id);
      if (!adoptee) return res.status(404).json({ error: 'Not found.' });

      const alreadyApplied = await Application.hasApplied(req.session.userId, req.params.id);

      res.json({ ...adoptee, alreadyApplied });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not load adoptee.' });
    }
  }

};

// Removes the internal-only scoring field before anything goes out over
// the wire — this is the actual enforcement point, not just a UI choice.
function stripScore(adoptee) {
  const { _compatibilityPercent, ...rest } = adoptee;
  return rest;
}

module.exports = browseController;
