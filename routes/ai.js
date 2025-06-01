// routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.post('/analyze', auth.authenticateToken, aiController.analyzeTrainingLog);

router.get('/user', auth.authenticateToken, aiController.getResultsByUser);

module.exports = router;