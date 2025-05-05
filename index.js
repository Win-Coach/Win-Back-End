// index.js

const express = require('express');
const app = express();
const PORT = 3000;

// JSON 파싱 미들웨어
app.use(express.json());

// 기본 라우터
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});