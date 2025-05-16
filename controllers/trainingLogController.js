const db = require('../db');

exports.createTrainingLog = async (req, res) => {
  try {
    const {
      intensity,
      immersion,
      achievement,
      emotion, // array
      pain_chest,
      pain_shoulder,
      pain_thigh,
      training_content,
      feedback,
      next_goal,
      weight,
      weather
    } = req.body;

    const user_id = req.user.id; // JWT에서 추출된 유저 ID

    // 필수값 체크
    if (!intensity || !immersion || !achievement || !weather) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }

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
        JSON.stringify(emotion),
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