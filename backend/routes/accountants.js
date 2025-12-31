const express = require('express');
const router = express.Router();
const Accountant = require('../models/Accountant');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Image Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/accountants';
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'accountant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// GET /api/accountants - List verified accountants (Public)
router.get('/', async (req, res) => {
  try {
    const accountants = await Accountant.findAll({
      where: { verified: true },
      order: [['createdAt', 'DESC']]
    });
    
    // Add full URL to image
    const accountantsWithUrl = accountants.map(acc => {
      const accJson = acc.toJSON();
      if (accJson.image) {
        accJson.image = `${req.protocol}://${req.get('host')}/${accJson.image}`;
      }
      return accJson;
    });

    res.json(accountantsWithUrl);
  } catch (error) {
    console.error('Error fetching accountants:', error);
    res.status(500).json({ message: 'Error loading accountants' });
  }
});

// GET /api/accountants/admin - List ALL accountants (Admin only)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (simplified check, you might want a role field)
    // For now, assuming any authenticated user can see (FIXME: Add role check)
    
    const accountants = await Accountant.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json(accountants);
  } catch (error) {
    console.error('Error fetching admin accountants:', error);
    res.status(500).json({ message: 'Error loading accountants' });
  }
});

// POST /api/accountants - Register a new accountant
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, email, phone, specialty, description, tags } = req.body;
    const userId = req.user.id; // From authMiddleware

    const newAccountant = await Accountant.create({
      name,
      email,
      phone,
      specialty,
      description,
      tags,
      userId,
      image: req.file ? req.file.path.replace(/\\/g, '/') : null,
      verified: false // Requires admin approval
    });

    res.status(201).json(newAccountant);
  } catch (error) {
    console.error('Error creating accountant:', error);
    res.status(500).json({ message: 'Error registering accountant' });
  }
});

// PUT /api/accountants/:id/verify - Verify an accountant (Admin only)
router.put('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const accountant = await Accountant.findByPk(id);

    if (!accountant) {
      return res.status(404).json({ message: 'Accountant not found' });
    }

    accountant.verified = true;
    await accountant.save();

    res.json({ message: 'Accountant verified successfully', accountant });
  } catch (error) {
    console.error('Error verifying accountant:', error);
    res.status(500).json({ message: 'Error verifying accountant' });
  }
});

// DELETE /api/accountants/:id - Delete an accountant (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const accountant = await Accountant.findByPk(id);

    if (!accountant) {
      return res.status(404).json({ message: 'Accountant not found' });
    }

    // Delete image file if exists
    if (accountant.image) {
      const imagePath = path.resolve(accountant.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await accountant.destroy();

    res.json({ message: 'Accountant deleted successfully' });
  } catch (error) {
    console.error('Error deleting accountant:', error);
    res.status(500).json({ message: 'Error deleting accountant' });
  }
});

module.exports = router;