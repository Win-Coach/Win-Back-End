const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth').authenticateToken;
const {
  createTrainingLog,
  getTrainingLogsByUserId
} = require('../controllers/trainingLogController');

// JWT 인증된 사용자만 접근 가능
router.post('/', authMiddleware, createTrainingLog);
router.get('/', authMiddleware, getTrainingLogsByUserId); // 로그인된 사용자의 훈련일지 전체 조회

module.exports = router;
