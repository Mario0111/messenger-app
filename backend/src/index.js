const express = require('express');
const cors = require('cors');
// const dotenv = require('dotenv'); // Not used, using native env or defaults

const { initDB } = require('./db');

// dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  console.log(`[DEBUG] Received ${req.method} request to ${req.url}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const friendRoutes = require('./routes/friend.routes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendRoutes);

app.get('/', (req, res) => {
  res.send('Messenger API is running');
});

// Initialize DB and Start Server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
