const express = require('express');
const { createConversation, getUserConversations, getMessages, sendMessage } = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createConversation);
router.get('/', getUserConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

module.exports = router;
