const express = require('express');
const { createConversation, createGroup, getUserConversations, getMessages, sendMessage, sendMediaMessage, sendTyping, toggleReaction } = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');
const updateLastActive = require('../middleware/activity.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(updateLastActive);

router.post('/', createConversation);
router.post('/group', createGroup);
router.get('/', getUserConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.post('/:conversationId/typing', sendTyping);
router.post('/:conversationId/media', upload.single('file'), sendMediaMessage);
router.post('/messages/:messageId/react', toggleReaction);

module.exports = router;
