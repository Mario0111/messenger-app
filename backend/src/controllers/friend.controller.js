const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

const sendRequest = async (req, res) => {
    const { receiverUsername } = req.body;
    const senderId = req.user.id;

    console.log(`[FriendRequest] User ${senderId} adding ${receiverUsername}`);

    try {
        // get receiver id
        const [users] = await pool.query('SELECT id FROM User WHERE username = ?', [receiverUsername]);
        if (users.length === 0) {
            console.log('[FriendRequest] User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        const receiverId = users[0].id;
        console.log(`[FriendRequest] Found receiver ${receiverId}`);

        if (receiverId === senderId) return res.status(400).json({ error: 'Cannot add yourself' });

        // Check existing
        const [existing] = await pool.query('SELECT * FROM FriendRequest WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)', [senderId, receiverId, receiverId, senderId]);
        if (existing.length > 0) {
            console.log('[FriendRequest] Request already exists');
            if (existing[0].status === 'accepted') return res.status(400).json({ error: 'Already friends' });
            if (existing[0].status === 'pending') return res.status(400).json({ error: 'Request already pending' });
        }

        const id = uuidv4();
        await pool.query('INSERT INTO FriendRequest (id, senderId, receiverId) VALUES (?, ?, ?)', [id, senderId, receiverId]);

        console.log('[FriendRequest] Sent successfully');
        res.json({ message: 'Request sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending request' });
    }
};

const getPendingRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const [requests] = await pool.query(`
            SELECT fr.id, u.username, fr.createdAt 
            FROM FriendRequest fr
            JOIN User u ON fr.senderId = u.id
            WHERE fr.receiverId = ? AND fr.status = 'pending'
        `, [userId]);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching requests' });
    }
};

const acceptRequest = async (req, res) => {
    const { requestId } = req.body;
    try {
        await pool.query('UPDATE FriendRequest SET status = "accepted" WHERE id = ?', [requestId]);
        res.json({ message: 'Accepted' });
    } catch (error) {
        res.status(500).json({ error: 'Error accepting request' });
    }
};

const declineRequest = async (req, res) => {
    const { requestId } = req.body;
    try {
        await pool.query('DELETE FROM FriendRequest WHERE id = ?', [requestId]);
        res.json({ message: 'Declined' });
    } catch (error) {
        res.status(500).json({ error: 'Error declining request' });
    }
};

const getFriends = async (req, res) => {
    const userId = req.user.id;
    try {
        // Find all requests where (sender = me OR receiver = me) AND status = accepted
        // Join with User to get the OTHER person's name
        const [friends] = await pool.query(`
            SELECT 
                u.id, 
                u.username, 
                u.avatarUrl,
                u.lastActiveAt,
                (SELECT COUNT(*) FROM Message m 
                 WHERE m.senderId = u.id 
                 AND m.conversationId IN (SELECT conversationId FROM ConversationMember WHERE userId = ?)
                 AND m.isRead = FALSE) as unreadCount
            FROM FriendRequest fr
            JOIN User u ON (fr.senderId = u.id OR fr.receiverId = u.id)
            WHERE (fr.senderId = ? OR fr.receiverId = ?)
            AND fr.status = 'accepted'
            AND u.id != ?
        `, [userId, userId, userId, userId]);

        const augmentedFriends = friends.map(f => {
            let isOnline = false;
            // Force AI to be online
            if (f.id === '0000-0000-AI') {
                isOnline = true;
            } else if (f.lastActiveAt) {
                const diffMs = new Date() - new Date(f.lastActiveAt);
                // Considered online if active in the last 2 minutes
                if (diffMs < 2 * 60 * 1000) {
                    isOnline = true;
                }
            }
            return {
                id: f.id,
                username: f.username,
                avatarUrl: f.avatarUrl,
                unreadCount: Number(f.unreadCount),
                isOnline
            };
        });

        res.json(augmentedFriends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching friends' });
    }
};

module.exports = { sendRequest, getPendingRequests, acceptRequest, declineRequest, getFriends };
