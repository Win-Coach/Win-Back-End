const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').authenticateToken; // 인증 미들웨어

// 1. injuryLogController에서 export한 모든 함수를 가져옵니다.
const {
  createInjuryLog,
  getInjuryLogs,
  deleteInjuryLog,
  analyzeRehabLog,
  getRehabAnalysis
} = require('../controllers/injuryLogController'); // 컨트롤러 파일 경로

// --- 부상 및 재활일지 CRUD API ---

// POST /injury-logs : 부상 또는 재활일지 생성
router.post('/', auth, createInjuryLog);

// GET /injury-logs : 사용자의 모든 부상 및 관련 재활일지 조회
router.get('/', auth, getInjuryLogs);

// DELETE /injury-logs/:id : 특정 부상 또는 재활일지 삭제
router.delete('/:id', auth, deleteInjuryLog);


// --- 재활일지 분석 API ---

// POST /injury-logs/analyze : 특정 재활일지 AI 분석 요청
router.post('/analyze', auth, analyzeRehabLog);

// GET /injury-logs/analyze/:log_id : 특정 재활일지의 분석 결과 조회
router.get('/analyze/:log_id', auth, getRehabAnalysis);


module.exports = router;
