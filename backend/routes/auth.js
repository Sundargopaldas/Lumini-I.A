const express = require('express');
const router = express.Router();

// Register
router.post('/register', (req, res) => {
  res.send('Register route');
});

// Login
router.post('/login', (req, res) => {
  res.send('Login route');
});

module.exports = router;
