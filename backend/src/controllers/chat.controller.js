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

const createGroup = async (req, res) => {
    const { title, memberIds } = req.body;
    const adminId = req.user.id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const conversationId = uuidv4();
        await connection.query('INSERT INTO Conversation (id, title) VALUES (?, ?)', [conversationId, title]);

        // Add Admin
        const m1Id = uuidv4();
        await connection.query('INSERT INTO ConversationMember (id, userId, conversationId, role) VALUES (?, ?, ?, "admin")', [m1Id, adminId, conversationId]);

        // Add Members
        for (const memberId of memberIds) {
            const mId = uuidv4();
            await connection.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [mId, memberId, conversationId]);
        }

        await connection.commit();
        res.json({ id: conversationId, title });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Could not create group' });
    } finally {
        connection.release();
    }
};

const getUserConversations = async (req, res) => {
    const userId = req.user.id;
    try {
        // Get all conversations user is in, including title
        const [conversations] = await pool.query(`
            SELECT c.id, c.title, c.createdAt
            FROM Conversation c
            JOIN ConversationMember cm ON c.id = cm.conversationId
            WHERE cm.userId = ?
            ORDER BY c.createdAt DESC
        `, [userId]);

        const result = [];
        for (const conv of conversations) {

            // If it has a title, it's a group (usually) or explicitly named
            // We still want to know who is in it to show avatars or names if title is missing
            const [members] = await pool.query(`
                SELECT u.id, u.username, u.avatarUrl, u.lastActiveAt
                FROM ConversationMember cm
                JOIN User u ON cm.userId = u.id
                WHERE cm.conversationId = ?
            `, [conv.id]);

            // Calculate unread count for this conversation
            const [unread] = await pool.query(`
                SELECT COUNT(*) as count FROM Message 
                WHERE conversationId = ? AND senderId != ? AND isRead = FALSE
            `, [conv.id, userId]);

            // If it's a DM (no title), we format it to look like the "other" person
            // If it's a Group (title exists), we use the title and maybe show array of avatars

            let formatted;
            if (conv.title) {
                formatted = {
                    id: conv.id,
                    isGroup: true,
                    username: conv.title, // Treat title as "username" for list display compatibility
                    avatarUrl: null, // Could generate a group avatar
                    members: members,
                    unreadCount: unread[0].count,
                    isOnline: members.some(m => {
                        if (m.id === userId) return false;
                        if (!m.lastActiveAt) return false;
                        return (new Date() - new Date(m.lastActiveAt)) < 2 * 60 * 1000;
                    }) // Group is online if ANY member is online? Or just force true?
                };
            } else {
                // DM Logic: Find the OTHER person
                const other = members.find(m => m.id !== userId);
                if (other) {
                    let isOnline = false;
                    // AI Check
                    if (other.id === '0000-0000-AI') isOnline = true;
                    else if (other.lastActiveAt) {
                        const diff = new Date() - new Date(other.lastActiveAt);
                        if (diff < 2 * 60 * 1000) isOnline = true;
                    }

                    formatted = {
                        id: conv.id,
                        isGroup: false,
                        username: other.username,
                        avatarUrl: other.avatarUrl,
                        unreadCount: unread[0].count,
                        isOnline,
                        otherUserId: other.id // Helpful for selecting
                    };
                }
            }

            if (formatted) result.push(formatted);
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching conversations' });
    }
};

// In-memory typing state: conversationId -> { userId: timestamp }
const typingState = {};

const sendTyping = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;

    if (!typingState[conversationId]) {
        typingState[conversationId] = {};
    }
    typingState[conversationId][userId] = Date.now();
    res.sendStatus(200);
}

const toggleReaction = async (req, res) => {
    const { messageId } = req.params;
    const { reaction } = req.body; // e.g., 'heart'
    const userId = req.user.id;

    try {
        // Check if exists
        const [existing] = await pool.query('SELECT id FROM MessageReaction WHERE messageId = ? AND userId = ?', [messageId, userId]);

        if (existing.length > 0) {
            // Remove
            await pool.query('DELETE FROM MessageReaction WHERE id = ?', [existing[0].id]);
            res.json({ status: 'removed' });
        } else {
            // Add
            await pool.query('INSERT INTO MessageReaction (id, messageId, userId, reaction) VALUES (?, ?, ?, ?)', [uuidv4(), messageId, userId, reaction]);
            res.json({ status: 'added' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error toggling reaction' });
    }
}

const getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id; // needed for reaction check
    try {
        const [rows] = await pool.query(`
            SELECT m.*, u.username, u.avatarUrl,
                   (SELECT COUNT(*) FROM MessageReaction mr WHERE mr.messageId = m.id) as reactionCount,
                   (SELECT COUNT(*) FROM MessageReaction mr WHERE mr.messageId = m.id AND mr.userId = ?) as userReacted
            FROM Message m
            JOIN User u ON m.senderId = u.id
            WHERE m.conversationId = ?
            ORDER BY m.createdAt ASC
        `, [userId, conversationId]);

        // Clean up typing state (remove old entries > 3s)
        const now = Date.now();
        const typingUsers = [];
        if (typingState[conversationId]) {
            for (const [uid, timestamp] of Object.entries(typingState[conversationId])) {
                // Keep typing status valid for 10 seconds to avoid flickering
                if (now - timestamp < 10000 && uid !== userId) {
                    typingUsers.push(uid);
                }
            }
        }

        // Mark as read
        await pool.query('UPDATE Message SET isRead = TRUE WHERE conversationId = ? AND senderId != ?', [conversationId, userId]);

        // Remap to match what frontend expects
        const messages = rows.map(m => ({
            ...m,
            sender: { id: m.senderId, username: m.username, avatarUrl: m.avatarUrl }
        }));

        res.json({ messages, typingUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching messages' });
    }
};

const { generateAIResponse } = require('../services/ai.service');

const sendMessage = async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    try {
        const messageId = uuidv4();
        await pool.query('INSERT INTO Message (id, conversationId, senderId, content) VALUES (?, ?, ?, ?)', [messageId, conversationId, senderId, content]);

        // Fetch it back to return full object
        const [rows] = await pool.query(`
        SELECT m.*, u.username, u.avatarUrl 
        FROM Message m
        JOIN User u ON m.senderId = u.id
        WHERE m.id = ?
    `, [messageId]);

        const m = rows[0];
        // Return with empty reaction fields to match new getMessages structure (frontend expects consistency usually)
        res.json({
            ...m,
            reactionCount: 0,
            userReacted: 0,
            sender: { id: m.senderId, username: m.username, avatarUrl: m.avatarUrl }
        });

        // --- AI BOT LOGIC ---
        // Check if the other participant is Nebula AI
        const [members] = await pool.query('SELECT userId FROM ConversationMember WHERE conversationId = ? AND userId != ?', [conversationId, senderId]);
        if (members.length > 0 && members[0].userId === '0000-0000-AI') {
            console.log("🤖 Nebula AI triggered!");

            // Trigger AI Typing Indicator (Fake it)
            if (!typingState[conversationId]) {
                typingState[conversationId] = {};
            }
            // Set timestamp slightly in future/now so it appears valid for next ~3-4 seconds
            typingState[conversationId]['0000-0000-AI'] = Date.now();

            // Get conversation history (last 5 messages) for context
            const [history] = await pool.query(`
                SELECT senderId, content FROM Message 
                WHERE conversationId = ? 
                ORDER BY createdAt DESC LIMIT 5
            `, [conversationId]);

            // Format for OpenAI
            const formattedHistory = history.reverse().map(msg => ({
                role: msg.senderId === '0000-0000-AI' ? 'assistant' : 'user',
                content: msg.content
            }));

            // Generate Response (Async, don't block response)
            generateAIResponse(content, formattedHistory).then(async (aiReplyText) => {
                if (!aiReplyText) return;
                const aiMsgId = uuidv4();
                await pool.query('INSERT INTO Message (id, conversationId, senderId, content) VALUES (?, ?, ?, ?)',
                    [aiMsgId, conversationId, '0000-0000-AI', aiReplyText]
                );
                console.log("🤖 Nebula AI Replied");
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending message' });
    }
};

const sendMediaMessage = async (req, res) => {
    const { conversationId } = req.params;
    const senderId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const mediaUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    // Determine type based on mimetype ideally, but for now we assume image if it's in this flow or check req.file.mimetype
    const type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
    // Simple check for audio
    const finalType = req.file.mimetype.startsWith('audio/') ? 'audio' : type;

    try {
        const messageId = uuidv4();
        await pool.query('INSERT INTO Message (id, conversationId, senderId, content, type, mediaUrl) VALUES (?, ?, ?, ?, ?, ?)',
            [messageId, conversationId, senderId, 'Sent an attachment', finalType, mediaUrl]
        );

        // Fetch back
        const [rows] = await pool.query(`
            SELECT m.*, u.username, u.avatarUrl 
            FROM Message m
            JOIN User u ON m.senderId = u.id
            WHERE m.id = ?
        `, [messageId]);

        const m = rows[0];
        res.json({
            ...m,
            reactionCount: 0,
            userReacted: 0,
            sender: { id: m.senderId, username: m.username, avatarUrl: m.avatarUrl }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error sending media' });
    }
}

module.exports = { createConversation, createGroup, getUserConversations, getMessages, sendMessage, sendMediaMessage, sendTyping, toggleReaction };
