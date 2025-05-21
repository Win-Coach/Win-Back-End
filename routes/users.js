const express = require('express');
const auth = require('../middleware/auth').authenticateToken;

const router = express.Router();
const {
  registerUser,
  getUsers,
  loginUser,
  getMyInfo
} = require('../controllers/userController'); 

router.post('/signup', registerUser);
router.get('/', getUsers);
router.post('/login', loginUser);
router.get('/me', auth, getMyInfo);

module.exports = router;

//이력서에 한줄 제목으로 보여줄말한 워딩으로 작성하기
