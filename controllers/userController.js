const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;

// 회원가입
exports.registerUser = async (req, res) => {
  const {
    user_id, password, name, nickname, gender, age,
    height_cm, weight_kg, mbti,
    athlete_type, sport, weekly_exercise_count,
    concern, goal
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (
        user_id, password, name, nickname, gender, age,
        height_cm, weight_kg, mbti,
        athlete_type, sport, weekly_exercise_count,
        concern, goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, hashedPassword, name, nickname, gender, age,
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

// 유저 전체 조회
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '조회 실패' });
  }
};

// 로그인 (JWT 발급)
exports.loginUser = async (req, res) => {
  const { user_id, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: '존재하지 않는 아이디입니다.' });
    }

    // 사용자가 입력한 비밀번호(평문)와 DB에 저장된 해시된 비밀번호 비교
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // ✅ JWT 발급
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
      message: '로그인 성공!',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        nickname: user.nickname,
        athlete_type: user.athlete_type,
        sport: user.sport
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '로그인 중 오류 발생' });
  }
};