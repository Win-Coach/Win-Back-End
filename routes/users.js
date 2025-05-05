const express = require('express');
const router = express.Router();
const {
  registerUser,
  getUsers
} = require('../controllers/userController'); 

router.post('/', registerUser); 
router.get('/', getUsers);      

module.exports = router;