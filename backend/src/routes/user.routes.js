const express = require('express');
const upload = require('../middleware/upload.middleware');
const { getAllUsers, uploadAvatar, getMe, getAllUsersAdmin, deleteUser } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, getAllUsers);
router.get('/me', authMiddleware, getMe);
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

// Admin Routes
router.get('/admin/all', authMiddleware, getAllUsersAdmin);
router.delete('/admin/:id', authMiddleware, deleteUser);

module.exports = router;
