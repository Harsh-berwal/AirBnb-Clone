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
const multer = require('multer');

// Local Modules
const storeRouter = require('./routes/storeRouter');
const hostRouter = require('./routes/hostRouter');
const authRouter = require('./routes/authRouter');

const rootDir = require('./utils/pathUtil');
const errorsController = require('./controllers/errors');

const app = express();

// Environment Variables
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH;
const SESSION_SECRET = process.env.SESSION_SECRET;

// View Engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Session Store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions',
});

// Session Store Error Handling
store.on('error', (error) => {
  console.log('Session Store Error:', error);
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Random String Generator
const randomString = {
  generate(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  },
};

// Multer Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },

  filename(req, file, cb) {
    const uniqueSuffix = randomString.generate(12);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

app.use(
  multer({
    storage,
    fileFilter,
  }).single('photo')
);

// Static Files
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Session Middleware
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  })
);

// Custom Middleware
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  req.user = req.session.user;
  next();
});

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.isLoggedIn;
  res.locals.user = req.user;
  next();
});

// Routes
app.use(storeRouter);
app.use('/auth', authRouter);

// Protected Routes
app.use('/host', (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect('/auth/login');
  }

  next();
});

app.use('/host', hostRouter);

// 404 Handler
app.use(errorsController.pageNotFound);

// Database Connection
mongoose
  .connect(DB_PATH)
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB Connection Error:', err);
  });