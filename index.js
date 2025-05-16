const express = require('express');
require('dotenv').config();
const app = express();
const db = require('./db');

const userRoutes = require('./routes/users');
const trainingLogRoutes = require('./routes/trainingLogs'); // ✅ 훈련일지 라우터

app.use(express.json());
app.use('/users', userRoutes);
app.use('/traininglogs', trainingLogRoutes); // ✅ 등록

const PORT = 3000;

db.query('SELECT 1')
  .then(() => console.log('✅ DB 연결 성공'))
  .catch(err => console.error('❌ DB 연결 실패:', err));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});