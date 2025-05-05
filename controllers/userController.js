const db = require('../db');

// 회원가입 API 로직
exports.registerUser = async (req, res) => {
  const {
    user_id, password, name, nickname, gender, age,
    height_cm, weight_kg, mbti,
    athlete_type, sport, weekly_exercise_count,
    concern, goal
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO users (
        user_id, password, name, nickname, gender, age,
        height_cm, weight_kg, mbti,
        athlete_type, sport, weekly_exercise_count,
        concern, goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, password, name, nickname, gender, age,
        height_cm, weight_kg, mbti,
        athlete_type, sport, weekly_exercise_count,
        concern, goal
      ]
    );
    res.status(201).json({ id: result.insertId, message: '회원가입 완료!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원가입 실패' });
  }
};

// 유저 조회 API 로직
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '조회 실패' });
  }
};