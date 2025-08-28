const { OpenAI } = require('openai');
const db =require('../db');
const dayjs = require('dayjs');

// .env 파일에서 환경 변수를 로드합니다.
require('dotenv').config();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST: OpenAI 분석 요청 + DB 저장
exports.analyzeTrainingLog = async (req, res) => {
  try {
    const { training_content, feedback, next_goal } = req.body;
    const user_id = req.user.id;

    if (!training_content && !feedback && !next_goal) {
        return res.status(400).json({ error: '분석할 내용이 없습니다.' });
    }

    const date = dayjs().format('YYYY-MM-DD');

    // --- OpenAI API 호출 로직 ---
    const completion = await openai.chat.completions.create({
      // 모델은 gpt-4o-mini 또는 gpt-4o 등을 사용할 수 있습니다.
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "당신은 사용자의 훈련일지를 분석하고 JSON 형식으로 피드백을 제공하는 전문 퍼스널 트레이너입니다. 답변은 반드시 한국어로 작성해주세요." 
        },
        { 
          role: "user", 
          // 👇 프롬프트의 JSON 형식 부분을 수정했습니다.
          content: `
            다음 훈련일지 내용을 바탕으로 전문적인 분석과 피드백을 제공해주세요.

            [오늘의 훈련 내용]
            ${training_content}

            [스스로에 대한 피드백]
            ${feedback}

            [다음 목표]
            ${next_goal}

            분석 결과는 반드시 다음 JSON 형식에 맞춰서 작성해주세요:
            {
              "good": "훈련 내용에서 긍정적인 점이나 잘한 점을 한 문장으로 요약해주세요.",
              "bad": "개선이 필요한 점이나 아쉬운 점을 한 문장으로 요약해주세요.",
              "coaching": "앞으로의 훈련 방향이나 동기부여를 위한 코칭 메시지를 한 문장으로 작성해주세요."
            }
          `
        }
      ],
      // OpenAI가 응답을 JSON 형식으로 주도록 강제합니다.
      response_format: { type: "json_object" },
    });

    // OpenAI 응답에서 분석 결과(JSON)를 파싱합니다.
    const analysis_result = JSON.parse(completion.choices[0].message.content);
    const resultJson = JSON.stringify(analysis_result); // DB 저장을 위해 다시 문자열로 변환

    // DB에 분석 결과를 저장합니다. (기존 로직과 동일)
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
    console.error('❌ OpenAI 분석 또는 저장 실패:', error);
    // OpenAI API 관련 에러인지 확인하여 더 구체적인 메시지 제공
    if (error.response) {
        console.error(error.response.data);
        return res.status(500).json({ error: 'OpenAI API 분석 중 오류가 발생했습니다.' });
    }
    return res.status(500).json({ error: '분석 실패 또는 DB 저장 오류' });
  }
};

// --- 이하 다른 함수들은 기존 코드와 동일합니다 ---

exports.getResultsByUser = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM analysis_results WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    // DB에서 읽은 JSON 문자열을 객체로 파싱하여 반환
    const results = rows.map(row => ({
        ...row,
        analysis_result: JSON.parse(row.analysis_result)
    }));
    res.json(results);
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
    // DB에서 읽은 JSON 문자열을 객체로 파싱하여 반환
    const result = {
        ...rows[0],
        analysis_result: JSON.parse(rows[0].analysis_result)
    };
    res.json(result);
  } catch (error) {
    console.error('❌ 단일 조회 오류:', error.message);
    res.status(500).json({ error: '서버 오류' });
  }
};

exports.getAnalysisByCreatedDate = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!isValidDate) {
    return res.status(400).json({ success: false, message: '날짜 형식 오류 (예: YYYY-MM-DD)' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT * FROM analysis_results
       WHERE user_id = ?
       AND DATE(created_at) = ?
       ORDER BY created_at DESC`,
      [userId, date]
    );
    // DB에서 읽은 JSON 문자열을 객체로 파싱하여 반환
    const results = rows.map(row => ({
        ...row,
        analysis_result: JSON.parse(row.analysis_result)
    }));
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('❌ 분석 결과 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};


exports.chatWithBot = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '메시지 내용이 올바르지 않습니다.' });
    }

    // 시스템 메시지를 추가하여 챗봇의 역할을 정의합니다.
    const systemMessage = {
      role: "system",
      content: "당신은 사용자의 말을 공감하며 들어주고, 따뜻한 위로와 격려를 해주는 멘탈 케어 챗봇입니다. 사용자의 감정을 안정시키고 긍정적인 방향으로 나아갈 수 있도록 도와주세요. 답변은 항상 친절하고 부드러운 말투의 한국어로 해주세요."
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages], // 시스템 메시지와 사용자 메시지를 함께 전달
    });

    const botResponse = completion.choices[0].message.content;

    return res.status(200).json({
      response: botResponse
    });

  } catch (error) {
    console.error('❌ 챗봇 API 오류:', error);
    if (error.response) {
      console.error(error.response.data);
      return res.status(500).json({ error: 'OpenAI 챗봇 API 처리 중 오류가 발생했습니다.' });
    }
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
