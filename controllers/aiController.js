const axios = require('axios');
const db = require('../db');
const dayjs = require('dayjs');

// POST: 분석 요청 + DB 저장
exports.analyzeTrainingLog = async (req, res) => {
  try {
    const { training_content, feedback, next_goal } = req.body;
    const user_id = req.user.id; 

    const date = dayjs().format('YYYY-MM-DD');

    const response = await axios.post('http://144.24.93.117:8000/analyze', {
      training_content,
      feedback,
      next_goal
    });

    const analysis_result = response.data;
    const resultJson = JSON.stringify(analysis_result);

    await db.execute(
      `INSERT INTO analysis_results (user_id, date, analysis_result)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE analysis_result = VALUES(analysis_result)`,
      [user_id, date, resultJson]
    );

    return res.status(200).json({
      message: '✅ 분석 성공 및 저장 완료',
      data: analysis_result
    });

  } catch (error) {
    console.error('❌ 분석 또는 저장 실패:', error.message);
    return res.status(500).json({ error: '분석 실패 또는 DB 저장 오류' });
  }
};

exports.getResultsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM analysis_results WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('❌ 사용자 전체 조회 오류:', error.message);
    res.status(500).json({ error: '서버 오류' });
  }
};

exports.getResultByUserAndDate = async (req, res) => {
  const { userId, date } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM analysis_results WHERE user_id = ? AND date = ?',
      [userId, date]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '해당 날짜의 분석 결과 없음' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ 단일 조회 오류:', error.message);
    res.status(500).json({ error: '서버 오류' });
  }
};