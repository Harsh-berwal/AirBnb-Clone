// Load Environment Variables
require('dotenv').config();

// Core Module
const path = require('path');

// External Modules
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Local Modules
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');

const rootDir = require('./utils/pathUtil');
const errorsController = require('./controllers/errors');
const authMiddleware = require('./middleware/auth');

const app = express();

// Environment Variables
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH;
const SESSION_SECRET = process.env.SESSION_SECRET || 'airbnb_session_fallback_secret';

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', 'views');

// Session Store Configuration
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions',
});

// Session Store Error Handling
store.on('error', (error) => {
  console.error('Session Store Error:', error);
});

// Body & Cookie Parsing Middleware
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static Files Middleware
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Session Middleware with Secure Cookie Configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Populate Authentication State into Request and Response Locals
app.use((req, res, next) => {
  req.isLoggedIn = req.session ? !!req.session.isLoggedIn : false;
  req.user = req.session ? req.session.user : null;
  res.locals.isLoggedIn = req.isLoggedIn;
  res.locals.user = req.user;
  next();
});

// Mount Routes
app.use(storeRouter);
app.use('/auth', authRouter);

// Protected Host Routes with Role Authorization
app.use(
  '/host',
  authMiddleware.isLoggedIn,
  authMiddleware.isHost,
  hostRouter
);

// 404 Catch-All Handler
app.use(errorsController.pageNotFound);

// Centralized 500 & Upload Error Handler
app.use(errorsController.get500);

// Database Connection & Server Initialization
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(DB_PATH)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB Connection Error:', err.message);
    });
}

module.exports = app;