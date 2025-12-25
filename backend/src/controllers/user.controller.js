const { pool } = require('../db');

const getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const [users] = await pool.query('SELECT id, username FROM User WHERE id != ?', [currentUserId]);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching users' });
    }
};

module.exports = { getAllUsers };
