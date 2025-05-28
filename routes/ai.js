const express = require('express');
const router = express.Router();
const { analyzeTrainingLog } = require('../controllers/aiController');

router.post('/analyze', analyzeTrainingLog);

module.exports = router;