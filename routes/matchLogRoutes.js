const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').authenticateToken; // 인증 미들웨어

// 1. matchLogController에서 export한 모든 함수를 가져옵니다.
const {
  createMatchLog,
  getMatchLogsByUserId,
  getMatchLogsByDate,
  deleteMatchLog,
  analyzeMatchLog,
  getMatchAnalysis
} = require('../controllers/matchLogController'); // 컨트롤러 파일 경로

// --- 경기일지 CRUD API ---

// POST /match-logs : 경기일지 생성
router.post('/', auth, createMatchLog);

// GET /match-logs : 사용자의 모든 경기일지 조회
router.get('/', auth, getMatchLogsByUserId);

// GET /match-logs/by-date : 날짜별 경기일지 조회 (쿼리 스트링 ?date=YYYY-MM-DD)
router.get('/by-date', auth, getMatchLogsByDate);

// DELETE /match-logs/:id : 특정 경기일지 삭제
router.delete('/:id', auth, deleteMatchLog);


// --- 경기일지 분석 API ---

// POST /match-logs/analyze : 특정 경기일지 AI 분석 요청
router.post('/analyze', auth, analyzeMatchLog);

// GET /match-logs/analyze/:log_id : 특정 경기일지의 분석 결과 조회
router.get('/analyze/:log_id', auth, getMatchAnalysis);


module.exports = router;
