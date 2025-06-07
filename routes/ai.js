const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// 훈련일지 AI 분석 요청 (POST)
router.post('/analyze', auth.authenticateToken, aiController.analyzeTrainingLog);

// 사용자 전체 분석 결과 조회 (GET)
router.get('/user', auth.authenticateToken, aiController.getResultsByUser);

// ✅ created_at 기준 날짜별 분석 결과 조회 (GET)
router.get('/user/by-created-at', auth.authenticateToken, aiController.getAnalysisByCreatedDate);

module.exports = router;