const db = require('../db');

exports.createTrainingLog = async (req, res) => {
  try {
    // 1. 요청 바디(req.body)에서 모든 통증 부위 데이터를 포함하여 변수들을 추출합니다.
    const {
      intensity,
      immersion,
      achievement,
      emotion,
      training_content,
      feedback,
      next_goal,
      weight,
      weather,
      pain_head,
      pain_neck,
      pain_shoulder,
      pain_chest,
      pain_abdomen,
      pain_waist,
      pain_arm,
      pain_wrist,
      pain_pelvis,
      pain_thigh,
      pain_knee,
      pain_calf,
      pain_ankle,
      pain_foot
    } = req.body;

    const user_id = req.user.id;

    if (!intensity || !immersion || !achievement || !weather) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }

    const emotionString = Array.isArray(emotion) ? JSON.stringify(emotion) : null;

    // 2. INSERT 쿼리에 모든 통증 부위 컬럼을 추가합니다.
    const query = `
      INSERT INTO training_logs (
        user_id, intensity, immersion, achievement, emotion,
        training_content, feedback, next_goal, weight, weather,
        pain_head, pain_neck, pain_shoulder, pain_chest, pain_abdomen,
        pain_waist, pain_arm, pain_wrist, pain_pelvis, pain_thigh,
        pain_knee, pain_calf, pain_ankle, pain_foot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 3. 쿼리 파라미터 배열에 모든 통증 부위 변수를 순서대로 추가합니다.
    //    값이 전달되지 않은 경우 DB에 NULL 대신 0이 들어가도록 처리합니다.
    const params = [
      user_id, intensity, immersion, achievement, emotionString,
      training_content, feedback, next_goal, weight, weather,
      pain_head || 0, pain_neck || 0, pain_shoulder || 0, pain_chest || 0, pain_abdomen || 0,
      pain_waist || 0, pain_arm || 0, pain_wrist || 0, pain_pelvis || 0, pain_thigh || 0,
      pain_knee || 0, pain_calf || 0, pain_ankle || 0, pain_foot || 0
    ];

    const [result] = await db.query(query, params);

    res.status(201).json({ message: '훈련일지 작성 완료', log_id: result.insertId });
  } catch (err) {
    console.error('🚨 훈련일지 저장 오류:', err);
    res.status(500).json({ error: '서버 오류로 인해 저장에 실패했습니다.' });
  }
};


exports.getTrainingLogsByUserId = async (req, res) => {
  const user_id = req.user.id;

  try {
    // SELECT * 를 사용하므로, 수정 없이 모든 통증 부위 데이터가 자동으로 포함됩니다.
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

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!date || !isValidDate) {
    return res.status(400).json({ error: '날짜가 필요합니다 (형식: YYYY-MM-DD).' });
  }

  try {
    // SELECT * 를 사용하므로, 수정 없이 모든 통증 부위 데이터가 자동으로 포함됩니다.
    const [logs] = await db.query(
      `SELECT * FROM training_logs
       WHERE user_id = ?
         AND DATE(created_at) = ?
       ORDER BY created_at DESC`,
      [user_id, date]
    );

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
    const [logs] = await db.query(
      'SELECT * FROM training_logs WHERE id = ? AND user_id = ?',
      [log_id, user_id]
    );

    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: '해당 로그를 찾을 수 없거나 권한이 없습니다.' });
    }

    await db.query('DELETE FROM training_logs WHERE id = ?', [log_id]);

    res.status(200).json({ success: true, message: '훈련일지가 삭제되었습니다.' });
  } catch (err)
    {
    console.error('❌ 훈련일지 삭제 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};
