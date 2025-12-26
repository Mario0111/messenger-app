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

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = `http://localhost:3000/uploads/${req.file.filename}`;
        const userId = req.user.id;

        await pool.query('UPDATE User SET avatarUrl = ? WHERE id = ?', [avatarUrl, userId]);

        res.json({ message: 'Avatar updated', avatarUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading avatar' });
    }
};

const getMe = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, avatarUrl FROM User WHERE id = ?', [req.user.id]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
}

const getAllUsersAdmin = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, role, country, lat, lng, createdAt FROM User ORDER BY createdAt DESC');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching users' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM User WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting user' });
    }
};

module.exports = { getAllUsers, uploadAvatar, getMe, getAllUsersAdmin, deleteUser };
