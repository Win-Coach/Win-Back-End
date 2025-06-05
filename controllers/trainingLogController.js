const db = require('../db');

exports.createTrainingLog = async (req, res) => {
  try {
    const {
      intensity,
      immersion,
      achievement,
      emotion, // <-- 여기 key 확인!
      pain_chest,
      pain_shoulder,
      pain_thigh,
      training_content,
      feedback,
      next_goal,
      weight,
      weather
    } = req.body;

    const user_id = req.user.id;

    if (!intensity || !immersion || !achievement || !weather) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }

    const emotionString = Array.isArray(emotion) ? JSON.stringify(emotion) : null;

    const [result] = await db.query(
      `INSERT INTO training_logs (
        user_id, intensity, immersion, achievement, emotion,
        pain_chest, pain_shoulder, pain_thigh,
        training_content, feedback, next_goal, weight, weather
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        intensity,
        immersion,
        achievement,
        emotionString,
        pain_chest,
        pain_shoulder,
        pain_thigh,
        training_content,
        feedback,
        next_goal,
        weight,
        weather
      ]
    );

    res.status(201).json({ message: '훈련일지 작성 완료', log_id: result.insertId });
  } catch (err) {
    console.error('🚨 훈련일지 저장 오류:', err);
    res.status(500).json({ error: '서버 오류로 인해 저장에 실패했습니다.' });
  }
};


exports.getTrainingLogsByUserId = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [logs] = await db.query(
      'SELECT * FROM training_logs WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('훈련일지 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

exports.getTrainingLogsByDate = async (req, res) => {
  const user_id = req.user.id;
  const { date } = req.query; // ex) '2025-06-05'

  // 날짜 형식 검증
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!date || !isValidDate) {
    return res.status(400).json({ error: '날짜가 필요합니다 (형식: YYYY-MM-DD).' });
  }

  try {
    const [logs] = await db.query(
      `SELECT * FROM training_logs
       WHERE user_id = ?
         AND DATE(created_at) = ?
       ORDER BY created_at DESC`,
      [user_id, date]
    );

    // 안전한 emotion 파싱
    const parsedLogs = logs.map(log => {
      let parsedEmotion = null;
      try {
        if (typeof log.emotion === 'string') {
          parsedEmotion = JSON.parse(log.emotion);
        } else if (Array.isArray(log.emotion)) {
          parsedEmotion = log.emotion;
        }
      } catch (e) {
        console.warn('⚠️ emotion 파싱 오류:', log.emotion);
      }

      return {
        ...log,
        emotion: parsedEmotion,
      };
    });

    res.status(200).json({ success: true, data: parsedLogs });
  } catch (err) {
    console.error('❌ 날짜별 훈련일지 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

exports.deleteTrainingLog = async (req, res) => {
  const user_id = req.user.id;
  const log_id = req.params.id;

  try {
    // 해당 로그가 본인의 것인지 확인
    const [logs] = await db.query(
      'SELECT * FROM training_logs WHERE id = ? AND user_id = ?',
      [log_id, user_id]
    );

    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: '해당 로그를 찾을 수 없거나 권한이 없습니다.' });
    }

    // 삭제 수행
    await db.query('DELETE FROM training_logs WHERE id = ?', [log_id]);

    res.status(200).json({ success: true, message: '훈련일지가 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 훈련일지 삭제 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};