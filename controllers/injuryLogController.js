const db = require('../db');
const { OpenAI } = require('openai');

// .env 파일에서 환경 변수를 로드합니다.
require('dotenv').config();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 부상 또는 재활일지 생성 (POST)
 */
exports.createInjuryLog = async (req, res) => {
  const user_id = req.user.id;
  const { log_type, parent_injury_id, log_date, ...data } = req.body;

  if (!log_type || (log_type !== '부상' && log_type !== '재활')) {
    return res.status(400).json({ error: "log_type은 '부상' 또는 '재활'이어야 합니다." });
  }

  // 재활일 경우, 부모 부상 ID가 필수입니다.
  if (log_type === '재활' && !parent_injury_id) {
    return res.status(400).json({ error: '재활일지에는 parent_injury_id가 필요합니다.' });
  }

  // 동적으로 쿼리 생성
  const fields = ['user_id', 'log_type', 'parent_injury_id', 'log_date'];
  const values = [user_id, log_type, parent_injury_id || null, log_date || new Date()];
  const placeholders = ['?', '?', '?', '?'];

  // 요청 본문의 데이터를 기반으로 필드와 값 추가
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      fields.push(key);
      // emotion 필드는 JSON 문자열로 변환
      const value = key === 'emotion' && Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key];
      values.push(value);
      placeholders.push('?');
    }
  }

  const query = `INSERT INTO injury_logs (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;

  try {
    const [result] = await db.query(query, values);
    res.status(201).json({ message: '일지 작성 완료', log_id: result.insertId });
  } catch (err) {
    console.error('🚨 부상/재활일지 저장 오류:', err);
    res.status(500).json({ error: '서버 오류로 인해 저장에 실패했습니다.' });
  }
};

/**
 * 사용자의 모든 부상 및 재활일지 조회 (GET)
 * 부상 기록 아래에 관련된 재활 기록이 중첩된 형태로 반환합니다.
 */
exports.getInjuryLogs = async (req, res) => {
    const user_id = req.user.id;
    try {
        const [logs] = await db.query(
            'SELECT * FROM injury_logs WHERE user_id = ? ORDER BY log_date DESC',
            [user_id]
        );

        // 부상 기록을 중심으로 데이터를 재구성
        const injuryMap = new Map();
        const rehabLogs = [];

        logs.forEach(log => {
            // emotion 필드 파싱
            try {
                if (log.emotion && typeof log.emotion === 'string') {
                    log.emotion = JSON.parse(log.emotion);
                }
            } catch (e) {
                log.emotion = null;
            }

            if (log.log_type === '부상') {
                log.rehab_logs = []; // 재활일지를 담을 배열 초기화
                injuryMap.set(log.id, log);
            } else {
                rehabLogs.push(log);
            }
        });

        // 재활 기록을 해당하는 부상 기록에 추가
        rehabLogs.forEach(rehab => {
            if (injuryMap.has(rehab.parent_injury_id)) {
                injuryMap.get(rehab.parent_injury_id).rehab_logs.push(rehab);
            }
        });

        const structuredLogs = Array.from(injuryMap.values());

        res.status(200).json({ success: true, data: structuredLogs });
    } catch (err) {
        console.error('❌ 부상/재활일지 조회 오류:', err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
};

/**
 * ✨ [신규] 날짜별 부상/재활일지 조회 (GET)
 */
exports.getInjuryLogsByDate = async (req, res) => {
  const user_id = req.user.id;
  const { date } = req.query; // ex) '2025-08-29'

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!date || !isValidDate) {
    return res.status(400).json({ error: '날짜가 필요합니다 (형식: YYYY-MM-DD).' });
  }

  try {
    const [logs] = await db.query(
      `SELECT * FROM injury_logs
       WHERE user_id = ? AND DATE(log_date) = ?
       ORDER BY created_at DESC`,
      [user_id, date]
    );

    // emotion 필드를 JSON 객체로 파싱
    const parsedLogs = logs.map(log => {
      let parsedEmotion = null;
      try {
        if (log.emotion && typeof log.emotion === 'string') {
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
    console.error('❌ 날짜별 부상/재활일지 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};


/**
 * 특정 부상/재활일지 삭제 (DELETE)
 */
exports.deleteInjuryLog = async (req, res) => {
  const user_id = req.user.id;
  const log_id = req.params.id;

  try {
    // ON DELETE CASCADE 제약 조건 덕분에 부모 부상 기록 삭제 시 자식 재활 기록도 자동 삭제됨
    const [result] = await db.query(
      'DELETE FROM injury_logs WHERE id = ? AND user_id = ?',
      [log_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '해당 로그를 찾을 수 없거나 권한이 없습니다.' });
    }

    res.status(200).json({ success: true, message: '일지가 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 부상/재활일지 삭제 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

/**
 * 재활일지 AI 분석 요청 (POST)
 */
exports.analyzeRehabLog = async (req, res) => {
  try {
    const { rehab_log_id } = req.body;
    const user_id = req.user.id;

    if (!rehab_log_id) {
      return res.status(400).json({ error: 'rehab_log_id가 필요합니다.' });
    }

    const [logs] = await db.query(
      "SELECT rehab_content, rehab_feedback, next_rehab_goal FROM injury_logs WHERE id = ? AND user_id = ? AND log_type = '재활'",
      [rehab_log_id, user_id]
    );

    if (logs.length === 0) {
      return res.status(404).json({ error: '해당 재활일지를 찾을 수 없거나 권한이 없습니다.' });
    }
    const log = logs[0];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 선수의 재활일지를 분석하고 JSON 형식으로 피드백을 제공하는 전문 재활 코치입니다. 답변은 반드시 한국어로 작성하고, 선수를 격려하는 따뜻한 말투를 사용해주세요."
        },
        {
          role: "user",
          content: `
            다음 재활일지 내용을 바탕으로 전문적인 분석과 피드백을 제공해주세요.

            [재활 내용]
            ${log.rehab_content || '내용 없음'}

            [셀프 피드백]
            ${log.rehab_feedback || '내용 없음'}

            [다음 재활 목표]
            ${log.next_rehab_goal || '내용 없음'}

            분석 결과는 반드시 다음 JSON 형식에 맞춰서 작성해주세요:
            {
              "잘한 점": "재활 과정에서 잘한 점이나 긍정적인 부분을 한 문장으로 요약해주세요.",
              "개선해야할 점": "다음 재활을 위해 개선하거나 주의해야 할 점을 한 문장으로 요약해주세요.",
              "멘탈 코칭": "선수의 꾸준한 재활을 독려하고 멘탈 관리를 위한 따뜻한 코칭 메시지를 한 문장으로 작성해주세요."
            }
          `
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysis_result = JSON.parse(completion.choices[0].message.content);
    const resultJson = JSON.stringify(analysis_result);

    await db.query(
      `INSERT INTO rehab_analysis_results (user_id, rehab_log_id, analysis_result)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE analysis_result = VALUES(analysis_result)`,
      [user_id, rehab_log_id, resultJson]
    );

    return res.status(200).json({
      message: '✅ 재활일지 분석 및 저장 완료',
      data: analysis_result
    });

  } catch (error) {
    console.error('❌ 재활일지 분석 또는 저장 실패:', error);
    if (error.response) {
      console.error(error.response.data);
      return res.status(500).json({ error: 'OpenAI API 분석 중 오류가 발생했습니다.' });
    }
    return res.status(500).json({ error: '분석 실패 또는 DB 저장 오류' });
  }
};

/**
 * 특정 재활일지의 분석 결과 조회 (GET)
 */
exports.getRehabAnalysis = async (req, res) => {
    const { log_id } = req.params;
    const user_id = req.user.id;

    try {
        const [rows] = await db.query(
            'SELECT * FROM rehab_analysis_results WHERE rehab_log_id = ? AND user_id = ?',
            [log_id, user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '해당 재활일지에 대한 분석 결과를 찾을 수 없습니다.' });
        }

        const analysis = {
            ...rows[0],
            analysis_result: JSON.parse(rows[0].analysis_result)
        };

        res.status(200).json({ success: true, data: analysis });
    } catch (err) {
        console.error('❌ 재활일지 분석 조회 오류:', err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
};
