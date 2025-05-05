const express = require('express');
const router = express.Router();
const {
  registerUser,
  getUsers,
  loginUser
} = require('../controllers/userController'); 

router.post('/', registerUser); 
router.get('/', getUsers);      
router.post('/login', loginUser);


module.exports = router;