const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get dashboard data
router.get('/', auth, (req, res) => {
  res.send('Dashboard data');
});

module.exports = router;
