const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// Get all goals for the user
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new goal
router.post('/', auth, async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, color } = req.body;

  try {
    const newGoal = await Goal.create({
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      color,
      userId: req.user.id,
    });

    res.json(newGoal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, color } = req.body;

  try {
    let goal = await Goal.findByPk(req.params.id);

    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }

    // Verify user owns goal
    if (goal.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    goal = await goal.update({
      name,
      targetAmount,
      currentAmount,
      deadline,
      color,
    });

    res.json(goal);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);

    if (!goal) {
      return res.status(404).json({ msg: 'Goal not found' });
    }

    if (goal.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await goal.destroy();
    res.json({ msg: 'Goal removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
