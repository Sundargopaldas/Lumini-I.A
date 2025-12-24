const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all transactions
router.get('/', auth, (req, res) => {
  res.send('Get all transactions');
});

// Create transaction
router.post('/', auth, (req, res) => {
  res.send('Create transaction');
});

module.exports = router;
