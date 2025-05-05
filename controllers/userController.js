const db = require('../db');
const bcrypt = require('bcrypt');

// 회원가입 API 로직
exports.registerUser = async (req, res) => {
  const {
    user_id, password, name, nickname, gender, age,
    height_cm, weight_kg, mbti,
    athlete_type, sport, weekly_exercise_count,
    concern, goal
  } = req.body;

  try {
    // Hash the password before storing
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


exports.loginUser = async (req, res) => {
    const { user_id, password } = req.body;
  
    try {
      // 1. 해당 ID가 존재하는지 확인
      const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
  
      if (rows.length === 0) {
        return res.status(400).json({ error: '존재하지 않는 아이디입니다.' });
      }
  
      const user = rows[0];
  
      // 2. 비밀번호 비교
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
      }
  
      // 3. 로그인 성공 응답 (추후 JWT 발급 가능)
      res.status(200).json({
        message: '로그인 성공!',
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