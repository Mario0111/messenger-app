const { pool } = require('./src/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Seeding Test Data...');

        // 1. Create Users
        const passwordHash = await bcrypt.hash('password123', 10);

        async function createUser(username) {
            const [rows] = await pool.query('SELECT id FROM User WHERE username = ?', [username]);
            if (rows.length > 0) return rows[0].id;

            const id = uuidv4();
            await pool.query('INSERT INTO User (id, username, password) VALUES (?, ?, ?)', [id, username, passwordHash]);
            console.log(`✅ Created User: ${username}`);
            return id;
        }

        const aliceId = await createUser('Alice');
        const bobId = await createUser('Bob');

        // 2. Create Friendship (Accepted)
        // Check if exists
        const [reqs] = await pool.query('SELECT * FROM FriendRequest WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)', [aliceId, bobId, bobId, aliceId]);

        if (reqs.length === 0) {
            const reqId = uuidv4();
            await pool.query('INSERT INTO FriendRequest (id, senderId, receiverId, status) VALUES (?, ?, ?, "accepted")', [reqId, aliceId, bobId]);
            console.log(`✅ Created Friendship: Alice <-> Bob`);
        } else {
            // ensure accepted
            await pool.query('UPDATE FriendRequest SET status = "accepted" WHERE id = ?', [reqs[0].id]);
            console.log(`✅ Ensured Friendship is ACCEPTED`);
        }

        // 3. Create Conversation
        let convId;
        const [convs] = await pool.query(`
            SELECT c.id FROM Conversation c
            JOIN ConversationMember m1 ON c.id = m1.conversationId
            JOIN ConversationMember m2 ON c.id = m2.conversationId
            WHERE m1.userId = ? AND m2.userId = ?
        `, [aliceId, bobId]);

        if (convs.length > 0) {
            convId = convs[0].id;
        } else {
            convId = uuidv4();
            await pool.query('INSERT INTO Conversation (id) VALUES (?)', [convId]);
            await pool.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [uuidv4(), aliceId, convId]);
            await pool.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [uuidv4(), bobId, convId]);
            console.log(`✅ Created Conversation`);
        }

        // 4. Send Unread Message (Alice -> Bob)
        const msgId = uuidv4();
        await pool.query('INSERT INTO Message (id, conversationId, senderId, content, isRead) VALUES (?, ?, ?, "Hello Bob! This is a test message.", FALSE)', [msgId, convId, aliceId]);
        console.log(`✅ Sent Unread Message: Alice -> Bob`);

        console.log('\n🎉 DONE! Log in as "Bob" (password: password123) to see the unread badge.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seed();
