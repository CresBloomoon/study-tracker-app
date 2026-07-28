function ok(res, payload) {
    res.status(200).json(payload);
  }
  
  module.exports = { ok };
  