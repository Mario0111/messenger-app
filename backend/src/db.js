const mysql = require('mysql2/promise');
require('dotenv').config(); // Load .env
const { v4: uuidv4 } = require('uuid');


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1212',
  database: 'messenger_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL Database');

    // RESET DB FOR DEV (Fixes collation issues)
    // RESET DB FOR DEV (Fixes collation issues) - DISABLED FOR PERSISTENCE
    // await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    // await connection.query('DROP TABLE IF EXISTS Message');
    // await connection.query('DROP TABLE IF EXISTS ConversationMember');
    // await connection.query('DROP TABLE IF EXISTS Conversation');
    // await connection.query('DROP TABLE IF EXISTS FriendRequest');
    // await connection.query('DROP TABLE IF EXISTS User');
    // await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        avatarUrl VARCHAR(500),
        lastActiveAt DATETIME,
        country VARCHAR(100),
        lat FLOAT,
        lng FLOAT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration for existing tables
    try {
      await connection.query("ALTER TABLE User ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user';");
    } catch (e) { }
    try {
      await connection.query("ALTER TABLE User ADD COLUMN country VARCHAR(100);");
    } catch (e) { }
    try {
      await connection.query("ALTER TABLE User ADD COLUMN lat FLOAT;");
    } catch (e) { }
    try {
      await connection.query("ALTER TABLE User ADD COLUMN lng FLOAT;");
    } catch (e) { }
    try {
      await connection.query("ALTER TABLE User ADD COLUMN lastActiveAt DATETIME;");
    } catch (e) { }
    try {
      await connection.query("ALTER TABLE User ADD COLUMN avatarUrl VARCHAR(500);");
    } catch (e) { }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Conversation (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ConversationMember (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36),
        conversationId VARCHAR(36),
        role VARCHAR(50) DEFAULT 'member',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
        UNIQUE KEY unique_member (userId, conversationId)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS Message (
        id VARCHAR(36) PRIMARY KEY,
        conversationId VARCHAR(36),
        senderId VARCHAR(36),
        content TEXT,
        isRead BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

    try {
      await connection.query("ALTER TABLE Message ADD COLUMN isRead BOOLEAN DEFAULT FALSE;");
    } catch (e) { }

    try {
      await connection.query("UPDATE Message SET isRead = FALSE WHERE isRead IS NULL");
    } catch (e) { }

    // Media Sharing Migrations
    try {
      await connection.query("ALTER TABLE Message ADD COLUMN type ENUM('text', 'image', 'file') DEFAULT 'text'");
    } catch (e) { }
    try {
      await connection.query("ALTER TABLE Message ADD COLUMN mediaUrl VARCHAR(500)");
    } catch (e) { }

    // Interactive Features Migrations
    try {
      await connection.query("ALTER TABLE Message MODIFY COLUMN type ENUM('text', 'image', 'file', 'audio') DEFAULT 'text'");
    } catch (e) { }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS MessageReaction (
        id VARCHAR(36) PRIMARY KEY,
        messageId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        reaction VARCHAR(50) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (messageId) REFERENCES Message(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS FriendRequest (
        id VARCHAR(36) PRIMARY KEY,
        senderId VARCHAR(36),
        receiverId VARCHAR(36),
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES User(id) ON DELETE CASCADE,
        UNIQUE KEY unique_request (senderId, receiverId)
      )
    `);

    // ENSURE NEBULA AI USER EXISTS
    const [aiUsers] = await connection.query('SELECT * FROM User WHERE id = "0000-0000-AI"');
    if (aiUsers.length === 0) {
      console.log('🤖 Creating Nebula AI System User...');
      // Password doesn't matter much as no one logs in as AI, but we hash it anyway
      // We use a fixed hash for simplicity or import bcrypt if needed. 
      // Since bcrypt require is at top of file usually, let me check. 
      // db.js doesn't have bcrypt. I'll just use a dummy string for password since AI never logs in via API.
      await connection.query('INSERT INTO User (id, username, password, avatarUrl) VALUES (?, ?, ?, ?)',
        ['0000-0000-AI', 'Nebula AI', '$2a$10$NebulaAISecretHashPlaceholder................', 'https://ui-avatars.com/api/?name=Nebula+AI&background=6366f1&color=fff&size=512']
      );
    }

    // ENSURE ALL USERS ARE FRIENDS WITH NEBULA AI
    const [allUsers] = await connection.query('SELECT id FROM User WHERE id != "0000-0000-AI"');
    const aiId = '0000-0000-AI';

    for (const user of allUsers) {
      const [existing] = await connection.query(
        'SELECT id FROM FriendRequest WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)',
        [user.id, aiId, aiId, user.id]
      );

      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO FriendRequest (id, senderId, receiverId, status) VALUES (?, ?, ?, "accepted")',
          [uuidv4(), aiId, user.id]
        );
        console.log(`🤖 Auto-friended user ${user.id} with Nebula AI`);
      }

      // ENSURE CONVERSATION EXISTS
      const [existingConv] = await connection.query(`
        SELECT c.id 
        FROM Conversation c
        JOIN ConversationMember m1 ON c.id = m1.conversationId
        JOIN ConversationMember m2 ON c.id = m2.conversationId
        WHERE m1.userId = ? AND m2.userId = ?
      `, [user.id, aiId]);

      if (existingConv.length === 0) {
        const convId = uuidv4();
        await connection.query('INSERT INTO Conversation (id) VALUES (?)', [convId]);
        await connection.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [uuidv4(), user.id, convId]);
        await connection.query('INSERT INTO ConversationMember (id, userId, conversationId) VALUES (?, ?, ?)', [uuidv4(), aiId, convId]);
        console.log(`🤖 Created conversation between user ${user.id} and Nebula AI`);
      }
    }

    connection.release();
    console.log('Tables initialized');
  } catch (error) {
    console.error('Error connecting to database or init tables:', error);
  }
};

module.exports = { pool, initDB };
