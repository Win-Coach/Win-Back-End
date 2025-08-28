const express = require('express');
const auth = require('../middleware/auth').authenticateToken;

const router = express.Router();
const {
  registerUser,
  getUsers,
  loginUser,
  getMyInfo,
  updateMyInfo,
  updateMyPassword
} = require('../controllers/userController'); 

router.post('/signup', registerUser);
router.get('/', getUsers);
router.post('/login', loginUser);
router.get('/me', auth, getMyInfo);
router.put('/me', auth, updateMyInfo);
router.put('/me/password', auth, updateMyPassword);

module.exports = router;
