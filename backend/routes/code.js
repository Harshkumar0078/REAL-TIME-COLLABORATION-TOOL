const express = require('express');
const router = express.Router();
const { executeCode, getSupportedLanguages } = require('../controllers/codeController');
const { protect } = require('../middleware/auth');

router.post('/execute', protect, executeCode);
router.get('/languages', getSupportedLanguages);

module.exports = router;
