const db = require('../db');
const { OpenAI } = require('openai');

// .env 파일에서 환경 변수를 로드합니다.
require('dotenv').config();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 경기일지 생성 (POST)
 */
exports.createMatchLog = async (req, res) => {
  try {
    // 1. 요청 바디(req.body)에서 경기일지에 필요한 모든 데이터를 추출합니다.
    const {
      weather,
      match_rank,
      personal_record,
      match_immersion,
      emotion,
      match_content,
      match_feedback,
      next_match_goal,
      pain_head, pain_neck, pain_shoulder, pain_chest, pain_abdomen,
      pain_waist, pain_arm, pain_wrist, pain_pelvis, pain_thigh,
      pain_knee, pain_calf, pain_ankle, pain_foot
    } = req.body;

    const user_id = req.user.id;

    // 필수 항목 검증
    if (!weather || !match_immersion) {
      return res.status(400).json({ error: '날씨와 경기 몰입도는 필수 항목입니다.' });
    }

    const emotionString = Array.isArray(emotion) ? JSON.stringify(emotion) : null;

    // 2. match_logs 테이블에 데이터를 INSERT하는 쿼리입니다.
    const query = `
      INSERT INTO match_logs (
        user_id, weather, match_rank, personal_record, match_immersion, emotion,
        match_content, match_feedback, next_match_goal,
        pain_head, pain_neck, pain_shoulder, pain_chest, pain_abdomen,
        pain_waist, pain_arm, pain_wrist, pain_pelvis, pain_thigh,
        pain_knee, pain_calf, pain_ankle, pain_foot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 3. 쿼리에 전달할 파라미터 배열입니다.
    const params = [
      user_id, weather, match_rank, personal_record, match_immersion, emotionString,
      match_content, match_feedback, next_match_goal,
      pain_head || 0, pain_neck || 0, pain_shoulder || 0, pain_chest || 0, pain_abdomen || 0,
      pain_waist || 0, pain_arm || 0, pain_wrist || 0, pain_pelvis || 0, pain_thigh || 0,
      pain_knee || 0, pain_calf || 0, pain_ankle || 0, pain_foot || 0
    ];

    const [result] = await db.query(query, params);

    res.status(201).json({ message: '경기일지 작성 완료', log_id: result.insertId });
  } catch (err) {
    console.error('🚨 경기일지 저장 오류:', err);
    res.status(500).json({ error: '서버 오류로 인해 저장에 실패했습니다.' });
  }
};

/**
 * 특정 사용자의 모든 경기일지 조회 (GET)
 */
exports.getMatchLogsByUserId = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [logs] = await db.query(
      'SELECT * FROM match_logs WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('경기일지 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

/**
 * 날짜별 경기일지 조회 (GET)
 */
exports.getMatchLogsByDate = async (req, res) => {
  const user_id = req.user.id;
  const { date } = req.query; // ex) '2025-08-29'

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!date || !isValidDate) {
    return res.status(400).json({ error: '날짜가 필요합니다 (형식: YYYY-MM-DD).' });
  }

  try {
    const [logs] = await db.query(
      `SELECT * FROM match_logs
       WHERE user_id = ? AND DATE(match_date) = ?
       ORDER BY created_at DESC`,
      [user_id, date]
    );

    // emotion 필드를 JSON 객체로 파싱
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
      return { ...log, emotion: parsedEmotion };
    });

    res.status(200).json({ success: true, data: parsedLogs });
  } catch (err) {
    console.error('❌ 날짜별 경기일지 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

/**
 * 경기일지 삭제 (DELETE)
 */
exports.deleteMatchLog = async (req, res) => {
  const user_id = req.user.id;
  const log_id = req.params.id;

  try {
    const [logs] = await db.query(
      'SELECT * FROM match_logs WHERE id = ? AND user_id = ?',
      [log_id, user_id]
    );

    if (logs.length === 0) {
      return res.status(404).json({ success: false, message: '해당 로그를 찾을 수 없거나 권한이 없습니다.' });
    }

    await db.query('DELETE FROM match_logs WHERE id = ?', [log_id]);

    res.status(200).json({ success: true, message: '경기일지가 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 경기일지 삭제 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

/**
 * ✨ [신규] 경기일지 AI 분석 요청 (POST)
 */
exports.analyzeMatchLog = async (req, res) => {
  try {
    const { match_log_id } = req.body;
    const user_id = req.user.id;

    if (!match_log_id) {
      return res.status(400).json({ error: 'match_log_id가 필요합니다.' });
    }

    // 1. DB에서 분석할 경기일지 원본 데이터를 가져옵니다.
    const [logs] = await db.query(
      'SELECT match_content, match_feedback, next_match_goal FROM match_logs WHERE id = ? AND user_id = ?',
      [match_log_id, user_id]
    );

    if (logs.length === 0) {
      return res.status(404).json({ error: '해당 경기일지를 찾을 수 없거나 권한이 없습니다.' });
    }
    const log = logs[0];

    // 2. OpenAI API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 선수의 경기일지를 분석하고 JSON 형식으로 피드백을 제공하는 전문 스포츠 코치입니다. 답변은 반드시 한국어로 작성하고, 친근하지만 전문적인 말투를 사용해주세요."
        },
        {
          role: "user",
          content: `
            다음 경기일지 내용을 바탕으로 전문적인 분석과 피드백을 제공해주세요.

            [경기 내용]
            ${log.match_content || '내용 없음'}

            [셀프 피드백]
            ${log.match_feedback || '내용 없음'}

            [다음 경기 목표]
            ${log.next_match_goal || '내용 없음'}

            분석 결과는 반드시 다음 JSON 형식에 맞춰서 작성해주세요:
            {
              "잘한 점": "경기에서 잘한 점이나 긍정적인 부분을 한 문장으로 요약해주세요.",
              "개선해야할 점": "다음 경기를 위해 개선하거나 보완해야 할 점을 한 문장으로 요약해주세요.",
              "멘탈 코칭": "선수의 동기부여나 멘탈 관리를 위한 따뜻한 코칭 메시지를 한 문장으로 작성해주세요."
            }
          `
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis_result = JSON.parse(completion.choices[0].message.content);
    const resultJson = JSON.stringify(analysis_result);

    // 3. 분석 결과를 match_analysis_results 테이블에 저장합니다.
    await db.query(
      `INSERT INTO match_analysis_results (user_id, match_log_id, analysis_result)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE analysis_result = VALUES(analysis_result)`,
      [user_id, match_log_id, resultJson]
    );

    return res.status(200).json({
      message: '✅ 경기일지 분석 및 저장 완료',
      data: analysis_result
    });

  } catch (error) {
    console.error('❌ 경기일지 분석 또는 저장 실패:', error);
    if (error.response) {
      console.error(error.response.data);
      return res.status(500).json({ error: 'OpenAI API 분석 중 오류가 발생했습니다.' });
    }
    return res.status(500).json({ error: '분석 실패 또는 DB 저장 오류' });
  }
};

/**
 * ✨ [신규] 특정 경기일지의 분석 결과 조회 (GET)
 */
exports.getMatchAnalysis = async (req, res) => {
    const { log_id } = req.params; // match_log_id를 log_id로 받음
    const user_id = req.user.id;

    try {
        const [rows] = await db.query(
            'SELECT * FROM match_analysis_results WHERE match_log_id = ? AND user_id = ?',
            [log_id, user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '해당 경기일지에 대한 분석 결과를 찾을 수 없습니다.' });
        }

        const analysis = {
            ...rows[0],
            analysis_result: JSON.parse(rows[0].analysis_result)
        };

        res.status(200).json({ success: true, data: analysis });
    } catch (err) {
        console.error('❌ 경기일지 분석 조회 오류:', err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
};
