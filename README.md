# 🏠 AirBnb – Property Rental Platform

A full-stack Airbnb-inspired web application built using **Node.js, Express.js, MongoDB, HTML, CSS, and JavaScript**.

The application allows users to explore property listings, create and manage listings, authenticate themselves, and interact with reviews.

---

## 🌐 Live Project

🚀 **[Visit the Live Website →](https://airbnb-bvrf.onrender.com/)**

---

## 📌 About The Project

AirBnb is a full-stack web application inspired by Airbnb.

The project combines a simple frontend built with **HTML, CSS, and JavaScript** with a backend powered by **Node.js and Express.js**. **MongoDB** is used for persistent data storage through **Mongoose**.

The application was developed to gain practical experience in full-stack web development, REST APIs, database management, authentication, authorization, middleware, and MVC architecture.

---

## ✨ Features

- 🏠 Browse property listings
- 🔍 View property details
- ➕ Create new property listings
- ✏️ Edit property listings
- 🗑️ Delete property listings
- 👤 User registration and login
- 🔐 Authentication and authorization
- ⭐ Add and manage reviews
- 🗄️ MongoDB database integration
- 🔄 RESTful routing
- 🛡️ Server-side validation
- ⚙️ Custom middleware
- 📱 Simple responsive frontend
- 🏗️ MVC-based backend structure

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- Passport.js
- Express Session

### Validation

- Joi

### Tools

- Git
- GitHub
- npm

---

## 🏗️ Application Architecture

```text
                         User
                          │
                          ▼
                 HTML / CSS / JavaScript
                          │
                          ▼
                   Express.js Server
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
          Routes     Middleware    Controllers
             │                         │
             └────────────┬────────────┘
                          ▼
                     Mongoose
                          │
                          ▼
                      MongoDB

## 📁 Project Structure

```text
AirBnb/
├── controllers/    # Application logic
├── init/           # Database initialization
├── models/         # MongoDB models
├── public/         # CSS & JavaScript
├── routes/         # Express routes
├── utils/          # Utility functions
├── views/          # Frontend templates
├── middleware.js   # Custom middleware
├── schema.js       # Validation schemas
├── app.js          # Main server file
└── package.json    # Dependencies & scripts
