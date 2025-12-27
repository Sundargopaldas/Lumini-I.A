const User = require('../models/User');

const checkPremium = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Allow 'agency' as well if it exists, or just 'premium'
    const allowedPlans = ['premium', 'agency'];
    
    if (!allowedPlans.includes(user.plan)) {
        return res.status(403).json({ 
            message: 'Recurso exclusivo para planos Premium. Faça upgrade para continuar.' 
        });
    }
    next();
  } catch (error) {
    console.error('Plan check error:', error);
    res.status(500).json({ message: 'Server error checking plan' });
  }
};

module.exports = checkPremium;