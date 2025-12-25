const mysql = require('mysql2/promise');

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
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS Message');
    await connection.query('DROP TABLE IF EXISTS ConversationMember');
    await connection.query('DROP TABLE IF EXISTS Conversation');
    await connection.query('DROP TABLE IF EXISTS FriendRequest');
    await connection.query('DROP TABLE IF EXISTS User');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE
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

    connection.release();
    console.log('Tables initialized');
  } catch (error) {
    console.error('Error connecting to database or init tables:', error);
  }
};

module.exports = { pool, initDB };
