import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helpers for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Port configuration
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để dễ phát triển view engine
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Test route
app.get('/', (req, res) => {
  res.render('pages/index', { title: 'Chat Core - Home' });
});

// Import and Register Socket Logic (Coming soon in Task 3.2)
// import webSocketService from './services/socket.service.js';
// webSocketService(io);

// Database Sync & Server Start
import sequelize from './config/database.js';

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    
    // Sync models (Coming soon in Phase 2)
    // await sequelize.sync({ alter: true });

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();
