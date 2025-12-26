const express = require('express');
const { register, login, logout, changePassword } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;
