const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// 1. aiController에서 필요한 모든 함수를 구조 분해하여 가져옵니다.
const {
  analyzeTrainingLog,
  getResultsByUser,
  getAnalysisByCreatedDate,
  chatWithBot // <-- chatWithBot 함수 추가
} = require('../controllers/aiController');

// 훈련일지 AI 분석 요청 (POST)
router.post('/analyze', auth.authenticateToken, analyzeTrainingLog);

// 사용자 전체 분석 결과 조회 (GET)
router.get('/user', auth.authenticateToken, getResultsByUser);

// created_at 기준 날짜별 분석 결과 조회 (GET)
router.get('/user/by-created-at', auth.authenticateToken, getAnalysisByCreatedDate);

// 2. 챗봇 API를 위한 새로운 라우트를 추가합니다.
router.post('/chatbot', auth.authenticateToken, chatWithBot);

module.exports = router;