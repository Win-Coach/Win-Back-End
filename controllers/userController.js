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


// 인증된 사용자 정보 조회
exports.getMyInfo = async (req, res) => {
  const userId = req.user.id; // auth 미들웨어에서 디코딩된 유저 ID

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자 정보를 찾을 수 없습니다.' });
    }
    const user = rows[0];
    delete user.password; // 비밀번호는 반환하지 않음
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
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


exports.updateMyInfo = async (req, res) => {
    // 1. 인증된 사용자의 ID를 가져옵니다. (authenticateToken 미들웨어에서 설정)
    const userId = req.user.id;

    // 2. 요청 바디에서 업데이트할 필드들을 가져옵니다.
    const {
        nickname,
        height_cm,
        weight_kg,
        mbti,
        weekly_exercise_count,
        concern,
        goal
    } = req.body;

    // 3. 업데이트할 필드와 값을 저장할 객체를 생성합니다.
    const fieldsToUpdate = {};
    if (nickname !== undefined) fieldsToUpdate.nickname = nickname;
    if (height_cm !== undefined) fieldsToUpdate.height_cm = height_cm;
    if (weight_kg !== undefined) fieldsToUpdate.weight_kg = weight_kg;
    if (mbti !== undefined) fieldsToUpdate.mbti = mbti;
    if (weekly_exercise_count !== undefined) fieldsToUpdate.weekly_exercise_count = weekly_exercise_count;
    if (concern !== undefined) fieldsToUpdate.concern = concern;
    if (goal !== undefined) fieldsToUpdate.goal = goal;

    // 4. 업데이트할 필드가 하나도 없으면 에러를 반환합니다.
    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ message: '업데이트할 데이터가 없습니다.' });
    }

    // 5. 동적 SQL 쿼리를 생성합니다.
    const setClauses = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
    const queryParams = Object.values(fieldsToUpdate);
    queryParams.push(userId); // WHERE 절에 사용할 ID 추가

    const query = `UPDATE users SET ${setClauses} WHERE id = ?`;

    try {
        // 6. 데이터베이스에 쿼리를 실행합니다.
        const [result] = await db.query(query, queryParams);

        // 7. 업데이트된 행이 없으면 사용자를 찾지 못한 것입니다.
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 8. 성공적으로 업데이트되면 성공 메시지를 반환합니다.
        res.status(200).json({ message: '사용자 정보가 성공적으로 업데이트되었습니다.' });

    } catch (error) {
        console.error('사용자 정보 업데이트 중 오류 발생:', error);
        // 닉네임 중복과 같은 UNIQUE 제약 조건 위반 처리
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
        }
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};


// 비밀번호 변경에 대한 API

exports.updateMyPassword = async (req, res) => {
    // 1. 인증된 사용자의 ID와 요청 바디에서 현재/새 비밀번호를 가져옵니다.
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 2. 요청 값 유효성 검사
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
    }

    try {
        // 3. DB에서 현재 사용자의 정보를 가져옵니다. (암호화된 비밀번호 포함)
        const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        const user = rows[0];

        // 4. 입력된 '현재 비밀번호'와 DB의 암호화된 비밀번호를 비교합니다.
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 5. '새 비밀번호'를 암호화(해싱)합니다.
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 6. DB에 암호화된 새 비밀번호를 업데이트합니다.
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        // 7. 성공 메시지를 반환합니다.
        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error('비밀번호 변경 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};