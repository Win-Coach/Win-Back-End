// routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

router.post('/analyze', authenticateToken, aiController.analyzeTrainingLog);

router.get('/user/:userId', aiController.getResultsByUser);

router.get('/user/:userId/:date', aiController.getResultByUserAndDate);

module.exports = router;