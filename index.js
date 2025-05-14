const express = require('express');
const app = express();
const userRoutes = require('./routes/users'); // 유저 라우터 불러오기

app.use(express.json());
app.use('/users', userRoutes); // /users 경로에 대한 요청 위임

const PORT = 3000;

const db = require('./db');

db.query('SELECT 1')
  .then(() => console.log('✅ DB 연결 성공'))
  .catch(err => console.error('❌ DB 연결 실패:', err));


app.listen(PORT, '0,0,0,0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});