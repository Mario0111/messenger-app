const express = require('express');
const { sendRequest, getPendingRequests, acceptRequest, declineRequest, getFriends } = require('../controllers/friend.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/request', sendRequest);
router.get('/requests', getPendingRequests);
router.post('/accept', acceptRequest);
router.post('/decline', declineRequest);
router.get('/', getFriends);

module.exports = router;
