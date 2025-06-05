const db = require('../db');

exports.getUserRoutines = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.execute(
      `SELECT r.id, r.title, r.subtitle, r.tag, ur.created_at
       FROM user_routines ur
       JOIN routines r ON ur.routine_id = r.id
       WHERE ur.user_id = ?
       ORDER BY ur.created_at DESC`,
      [userId]
    );

    res.status(200).json({ routines: rows });
  } catch (error) {
    console.error('❌ 사용자 루틴 조회 실패:', error.message);
    res.status(500).json({ error: '루틴 조회 중 오류 발생' });
  }
};


// 사용자 루틴 추가
exports.addUserRoutine = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { routine_id } = req.body;

    // 존재하는 루틴인지 확인
    const [routineRows] = await db.execute(
      'SELECT * FROM routines WHERE id = ?',
      [routine_id]
    );
    if (routineRows.length === 0) {
      return res.status(404).json({ error: '해당 루틴이 존재하지 않습니다.' });
    }

    // 이미 추가했는지 중복 체크
    const [exists] = await db.execute(
      'SELECT * FROM user_routines WHERE user_id = ? AND routine_id = ?',
      [user_id, routine_id]
    );
    if (exists.length > 0) {
      return res.status(409).json({ error: '이미 추가된 루틴입니다.' });
    }

    // 추가
    await db.execute(
      'INSERT INTO user_routines (user_id, routine_id) VALUES (?, ?)',
      [user_id, routine_id]
    );

    res.status(200).json({ message: '✅ 루틴 추가 완료' });

  } catch (error) {
    console.error('❌ 루틴 추가 실패:', error.message);
    res.status(500).json({ error: '서버 오류' });
  }
};

// 사용자 루틴 삭제
exports.deleteUserRoutine = async (req, res) => {
  try {
    const user_id = req.user.id;
    const routine_id = req.params.routineId;

    // 해당 루틴이 유저에게 존재하는지 확인
    const [exists] = await db.execute(
      'SELECT * FROM user_routines WHERE user_id = ? AND routine_id = ?',
      [user_id, routine_id]
    );
    if (exists.length === 0) {
      return res.status(404).json({ error: '삭제할 루틴이 없습니다.' });
    }

    // 삭제 실행
    await db.execute(
      'DELETE FROM user_routines WHERE user_id = ? AND routine_id = ?',
      [user_id, routine_id]
    );

    res.status(200).json({ message: '✅ 루틴 삭제 완료' });

  } catch (error) {
    console.error('❌ 루틴 삭제 실패:', error.message);
    res.status(500).json({ error: '서버 오류' });
  }
};

// 전체 루틴 목록 조회 (고정 루틴 테이블)
exports.getAllRoutines = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM routines ORDER BY id ASC');
    res.status(200).json({ routines: rows });
  } catch (error) {
    console.error('❌ 전체 루틴 조회 실패:', error.message);
    res.status(500).json({ error: '루틴 목록 조회 중 오류 발생' });
  }
};