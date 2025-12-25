const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Create or get existing conversation
const createConversation = async (req, res) => {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if conversation exists
        // We are looking for a conversationId that has BOTH userId = senderId AND userId = recipientId
        const [existing] = await connection.query(`
      SELECT c.* 
      FROM Conversation c
      JOIN ConversationMember m1 ON c.id = m1.conversationId
      JOIN ConversationMember m2 ON c.id = m2.conversationId
      WHERE m1.userId = ? AND m2.userId = ?
    `, [senderId, recipientId]);

        if (existing.length > 0) {
            await connection.commit();
            return res.json(existing[0]);
        }

        // Create new
        const conversationId = uuidv4();
        await connection.query('INSERT INTO Conversation (id) VALUES (?)', [conversationId]);

        const m1Id = uuidv4();
        const m2Id = uuidv4();
        await connection.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [m1Id, senderId, conversationId]);
        await connection.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [m2Id, recipientId, conversationId]);

        await connection.commit();
        res.json({ id: conversationId });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Could not create conversation' });
    } finally {
        connection.release();
    }
};

const getUserConversations = async (req, res) => {
    const userId = req.user.id;
    try {
        // Basic implementation: get all conversations I am in
        // Then for each, find the OTHER member
        const [memberships] = await pool.query('SELECT conversationId FROM ConversationMember WHERE userId = ?', [userId]);

        const conversations = [];
        for (const mem of memberships) {
            const convId = mem.conversationId;

            // Get other member
            const [others] = await pool.query(`
        SELECT u.id, u.username 
        FROM ConversationMember cm
        JOIN User u ON cm.userId = u.id
        WHERE cm.conversationId = ? AND cm.userId != ?
      `, [convId, userId]);

            if (others.length > 0) {
                conversations.push({
                    id: convId,
                    members: [{ user: others[0] }] // Structure matches what frontend expects roughly
                });
            }
        }

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
};

const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    try {
        const [messages] = await pool.query(`
      SELECT m.*, u.username 
      FROM Message m
      JOIN User u ON m.senderId = u.id
      WHERE m.conversationId = ?
      ORDER BY m.createdAt ASC
    `, [conversationId]);

        // Remap to match what frontend expects (sender object)
        const formatted = messages.map(m => ({
            ...m,
            sender: { id: m.senderId, username: m.username }
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
};

const sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    try {
        const messageId = uuidv4();
        await pool.query('INSERT INTO Message (id, conversationId, senderId, content) VALUES (?, ?, ?, ?)', [messageId, conversationId, senderId, content]);

        // Fetch it back to return full object
        const [rows] = await pool.query(`
        SELECT m.*, u.username 
        FROM Message m
        JOIN User u ON m.senderId = u.id
        WHERE m.id = ?
    `, [messageId]);

        const m = rows[0];
        res.json({
            ...m,
            sender: { id: m.senderId, username: m.username }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending message' });
    }
};

module.exports = { createConversation, getUserConversations, getMessages, sendMessage };
