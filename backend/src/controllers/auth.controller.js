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

        // 🌍 GEOLOCATION (Real IP Detection)
        let country = null, lat = null, lng = null;
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            // Handle localhost or ::1
            const queryIp = (ip === '::1' || ip === '127.0.0.1') ? '' : ip;

            const axios = require('axios');
            const geoRes = await axios.get(`http://ip-api.com/json/${queryIp}`);
            if (geoRes.data.status === 'success') {
                country = geoRes.data.country;
                lat = geoRes.data.lat;
                lng = geoRes.data.lon;
                console.log(`📍 Detected location for ${username}: ${country} (${lat}, ${lng})`);
            }
        } catch (e) {
            console.error("Geo-detection failed:", e.message);
        }

        await pool.query('INSERT INTO User (id, username, password, country, lat, lng) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, hashedPassword, country, lat, lng]);

        // Auto-friend Nebula AI
        try {
            const aiId = '0000-0000-AI';
            const reqId = uuidv4();
            // Check if AI exists (it should)
            const [ai] = await pool.query('SELECT id FROM User WHERE id = ?', [aiId]);
            if (ai.length > 0) {
                await pool.query('INSERT INTO FriendRequest (id, senderId, receiverId, status) VALUES (?, ?, ?, "accepted")', [reqId, aiId, userId]);

                // Create Conversation
                const convId = uuidv4();
                await pool.query('INSERT INTO Conversation (id) VALUES (?)', [convId]);
                await pool.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [uuidv4(), userId, convId]);
                await pool.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [uuidv4(), aiId, convId]);

                // Optional: Send a welcome message from AI?
                await pool.query('INSERT INTO Message (id, conversationId, senderId, content, isRead) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), convId, aiId, "Hello! I am Nebula AI. You can ask me anything.", false]
                );
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

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret_key_change_me', {
            expiresIn: '1h',
        });

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
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

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [users] = await pool.query('SELECT * FROM User WHERE id = ?', [userId]);
        const user = users[0];

        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE User SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error changing password' });
    }
}

module.exports = { register, login, logout, changePassword };
