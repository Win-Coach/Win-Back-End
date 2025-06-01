const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routineController');
const { authenticateToken } = require('../middleware/auth');

router.post('/add', authenticateToken, routineController.addUserRoutine);  // 루틴 추가
router.get('/', authenticateToken, routineController.getUserRoutines);     // ✅ 사용자 루틴만 조회

module.exports = router;