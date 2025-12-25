const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // We might need to install uuid or use crypto.randomUUID

const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [existingUsers] = await pool.query('SELECT * FROM User WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        await pool.query('INSERT INTO User (id, username, password) VALUES (?, ?, ?)', [userId, username, hashedPassword]);

        // Auto-friend Nebula AI
        try {
            const aiId = '0000-0000-AI';
            const reqId = uuidv4();
            // Check if AI exists (it should)
            const [ai] = await pool.query('SELECT id FROM User WHERE id = ?', [aiId]);
            if (ai.length > 0) {
                await pool.query('INSERT INTO FriendRequest (id, senderId, receiverId, status) VALUES (?, ?, ?, "accepted")', [reqId, aiId, userId]);
            }
        } catch (e) {
            console.error("Failed to auto-friend AI:", e);
        }

        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const [users] = await pool.query('SELECT * FROM User WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret_key_change_me', {
            expiresIn: '1h',
        });

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    try {
        if (req.user) {
            // Set last active to null or old time to verify offline
            await pool.query('UPDATE User SET lastActiveAt = NULL WHERE id = ?', [req.user.id]);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Logout failed' });
    }
}

module.exports = { register, login, logout };
