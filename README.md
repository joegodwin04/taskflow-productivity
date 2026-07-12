# 🚀 TaskFlow – Smart Productivity & Task Management Platform

<p align="center">
  <strong>Organize your work. Build better habits. Achieve your goals.</strong>
</p>

---

## 📖 Overview

TaskFlow is a modern full-stack productivity platform designed to help users efficiently manage their daily workflow. It combines task management, habit tracking, goal planning, Pomodoro focus sessions, routines, analytics, and secure authentication into a single application.

The project is built using modern web technologies and follows a production-ready deployment architecture with a PostgreSQL database hosted on Neon.

---

## ✨ Features

### 🔐 Authentication
- Secure JWT Authentication
- User Registration & Login
- Password Encryption
- Protected Routes

### ✅ Task Management
- Create Tasks
- Update Tasks
- Delete Tasks
- Mark Tasks as Completed
- Priority Management

### 🎯 Goal Tracking
- Create Personal Goals
- Track Progress
- Update Goal Status

### 🔥 Habit Tracker
- Daily Habit Tracking
- Habit Completion History
- Progress Monitoring

### 🍅 Pomodoro Timer
- Focus Sessions
- Session History
- Productivity Tracking

### 📅 Daily Routine
- Create Daily Routines
- Edit Routines
- Completion Tracking

### 📊 Dashboard & Analytics
- Productivity Overview
- Task Statistics
- Habit Insights
- Goal Progress

### 📄 Reports
- Generate Productivity Reports
- Export Data

### 📱 Responsive Design
- Desktop Friendly
- Tablet Support
- Mobile Responsive

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Vite
- JavaScript (ES6+)
- CSS3
- React Router

## Backend
- Node.js
- Express.js

## Database
- PostgreSQL (Neon)
- Sequelize ORM

## Authentication
- JWT (JSON Web Token)
- bcrypt

## Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

---

# 🏗️ Project Architecture

```
                React + Vite
                      │
                      ▼
                Express.js API
                      │
                      ▼
             Sequelize ORM
                      │
                      ▼
           PostgreSQL (Neon)
```

---

# 📁 Project Structure

```
taskflow-productivity/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
│
├── README.md
├── package.json
└── .env
```

---

# 🚀 Getting Started

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/joegodwin04/taskflow-productivity.git
cd taskflow-productivity
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file in the project root.

```env
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
JWT_SECRET=your_secret_key

# Local Development
# SQLite is used automatically.

# Production
# DATABASE_URL=your_postgresql_connection_string
```

---

## 4️⃣ Start the Application

### Frontend

```bash
npm run dev
```

### Backend

```bash
npm run server
```

---

## 5️⃣ Open the Application

Frontend

```
http://localhost:5173
```

Backend API

```
http://localhost:5000/api
```

---

# 🌐 Live Demo

### Frontend

> https://taskflow-productivity-one.vercel.app

### Backend API

> https://taskflow-backend-t2h0.onrender.com/api

---

# 💾 Database

### Local Development

- SQLite
- Automatic setup
- No additional configuration required

### Production

- PostgreSQL (Neon)
- Persistent cloud database
- Managed through Sequelize ORM

---

# 🔒 Security

- JWT Authentication
- Password Hashing using bcrypt
- Protected API Routes
- Environment Variables
- CORS Protection

---

# 📈 Future Enhancements

- Email Verification
- Password Reset
- OAuth Login (Google/GitHub)
- Push Notifications
- Calendar Integration
- Team Collaboration
- Real-time Updates
- AI Productivity Assistant
- Dark Mode
- Mobile Application

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/YourFeature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to GitHub

```bash
git push origin feature/YourFeature
```

5. Open a Pull Request

---

# 👨‍💻 Author

**Joe Godwin**

- GitHub: https://github.com/joegodwin04

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

It helps support the project and motivates future development.

---

<p align="center">
Made with ❤️ using React, Node.js, Express, Sequelize & PostgreSQL
</p>
