const { pool } = require('./src/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Seeding Test Data...');

        // 1. Create Users
        const passwordHash = await bcrypt.hash('password123', 10);

        async function createUser(username, password = 'password123', role = 'user', location = {}) {
            const [rows] = await pool.query('SELECT id FROM User WHERE username = ?', [username]);
            if (rows.length > 0) return rows[0].id;

            const finalPasswordHash = await bcrypt.hash(password, 10);
            const id = uuidv4();
            const { country = null, lat = null, lng = null } = location;

            await pool.query('INSERT INTO User (id, username, password, role, country, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, username, finalPasswordHash, role, country, lat, lng]);
            console.log(`✅ Created User: ${username} (${role})`);
            return id;
        }

        const adminId = await createUser('admin', 'admin', 'admin');
        if (adminId) {
            console.log(`✅ Created Admin User: admin`);
            await pool.query('UPDATE User SET role = "admin" WHERE id = ?', [adminId]);
        }

        const aliceId = await createUser('Alice', 'password123', 'user', { country: 'USA', lat: 40.7128, lng: -74.0060 }); // NYC
        const bobId = await createUser('Bob', 'password123', 'user', { country: 'UK', lat: 51.5074, lng: -0.1278 }); // London

        // Global Seed Users
        const globalUsers = [
            { name: 'Yuki', country: 'Japan', lat: 35.6762, lng: 139.6503 },
            { name: 'Carlos', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
            { name: 'Sven', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
            { name: 'Priya', country: 'India', lat: 19.0760, lng: 72.8777 },
            { name: 'Liam', country: 'Australia', lat: -33.8688, lng: 151.2093 },
            { name: 'Fatima', country: 'UAE', lat: 25.2048, lng: 55.2708 },
            { name: 'Chen', country: 'China', lat: 31.2304, lng: 121.4737 },
            { name: 'Amara', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
            { name: 'Isabella', country: 'Italy', lat: 41.9028, lng: 12.4964 },
            { name: 'Hans', country: 'Germany', lat: 52.5200, lng: 13.4050 }
        ];

        for (const u of globalUsers) {
            await createUser(u.name, 'password123', 'user', { country: u.country, lat: u.lat, lng: u.lng });
        }

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

        console.log(`✅ Sent Unread Message: Alice -> Bob`);

        // 5. Ensure All Friends with AI
        const aiId = '0000-0000-AI';
        const usersToFriend = [aliceId, bobId, adminId].filter(id => id); // adminId might be undefined if not created in this run? No, it's defined above.

        for (const uid of usersToFriend) {
            // Check existence first to avoid duplicate errors if seed run multiple times
            const [exists] = await pool.query('SELECT id FROM FriendRequest WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)', [uid, aiId, aiId, uid]);
            if (exists.length === 0) {
                await pool.query('INSERT INTO FriendRequest (id, senderId, receiverId, status) VALUES (?, ?, ?, "accepted")', [uuidv4(), aiId, uid]);
                console.log(`✅ Friended ${uid} with Nebula AI`);
            }
        }

        console.log('\n🎉 DONE! Log in as "Bob" (password: password123) to see the unread badge.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seed();
