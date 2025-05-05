const express = require('express');
const app = express();
const userRoutes = require('./routes/users'); // 유저 라우터 불러오기

app.use(express.json());
app.use('/users', userRoutes); // /users 경로에 대한 요청 위임

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});