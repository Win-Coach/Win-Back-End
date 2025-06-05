const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth').authenticateToken;
const {
  createTrainingLog,
  getTrainingLogsByUserId,
  getTrainingLogsByDate, // 🔽 날짜별 조회용 컨트롤러 추가
  deleteTrainingLog
} = require('../controllers/trainingLogController');

// 훈련일지 작성
router.post('/', authMiddleware, createTrainingLog);

// 훈련일지 전체 조회
router.get('/', authMiddleware, getTrainingLogsByUserId);

// 🔽 날짜별 훈련일지 조회
router.get('/by-date', authMiddleware, getTrainingLogsByDate);
router.delete('/:id', authMiddleware, deleteTrainingLog);
module.exports = router;