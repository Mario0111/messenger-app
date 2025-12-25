const { pool } = require('../db');

const updateLastActive = async (req, res, next) => {
    if (req.user) {
        try {
            await pool.query('UPDATE User SET lastActiveAt = NOW() WHERE id = ?', [req.user.id]);
        } catch (error) {
            console.error('Failed to update last active', error);
        }
    }
    next();
};

module.exports = updateLastActive;
