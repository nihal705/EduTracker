# EduTracker - Student Academic Performance Tracker

<div align="center">

**A comprehensive platform for institutions to manage and students to track academic performance**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)](https://mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [License](#license)

---

## 🎯 Overview

EduTracker is a full-stack web application designed to streamline academic performance tracking for educational institutions and students. It provides a robust platform for managing student records, calculating SGPA/CGPA, tracking internal assessments (IA1/IA2), and generating analytical insights.

### Key Highlights
- **Institution Portal**: Manage students, record external exam results, track internal assessments, and generate analytics
- **Student Portal**: Access academic records, view SGPA/CGPA trends, check internal marks, and track performance
- **Real-time Notifications**: Instant updates when results are published
- **Dark Mode**: Modern UI with light/dark theme toggle
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

---

## ✨ Features

### For Institutions
- 🏫 **Student Management** - Add, edit, delete student records
- 📘 **External Exam Management** - Record SGPA/CGPA with subject-wise marks
- 📝 **Internal Assessment** - Manage IA1/IA2 marks with flexible "out of" values
- 📊 **Analytics Dashboard** - Visual charts for department-wise and semester-wise performance
- 🏆 **Top Performers** - Identify distinction students and rank them
- 📧 **Notifications** - Send real-time updates to students
- 🏛️ **Department Management** - Configure departments and subjects

### For Students
- 👨‍🎓 **Personal Dashboard** - View CGPA, SGPA trends, and semester summaries
- 📈 **Performance Analytics** - Track improvement over semesters
- 🏅 **Rank & Percentile** - See your rank within your institution
- 📧 **Profile Management** - Update personal information
- 🔔 **Real-time Alerts** - Get notified when results are published

### System Features
- 🌓 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive Design** - Mobile-friendly interface
- 🔒 **Secure Authentication** - JWT-based auth with password encryption
- 📊 **Interactive Charts** - Visual data representation using Chart.js
- 🔔 **Real-time Socket Events** - Instant notifications via Socket.IO

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x | Runtime environment |
| Express.js | 4.x | Web framework |
| MySQL | 8.x | Database |
| Socket.IO | 4.x | Real-time notifications |
| JWT | 9.x | Authentication |
| Bcryptjs | 2.x | Password hashing |
| Nodemailer | 6.x | Email services |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| HTML5 | - | Structure |
| CSS3 | - | Styling & animations |
| JavaScript | ES6+ | Client-side logic |
| Bootstrap | 5.3 | UI components |
| Chart.js | 4.4 | Data visualization |
| Font Awesome | 6.4 | Icons |

---

## 📦 Installation

### Prerequisites
- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8 or higher) - [Download](https://mysql.com/)
- **npm** (v10 or higher) - Comes with Node.js
- **Git** (optional) - [Download](https://git-scm.com/)

### Clone and Install

```bash
git clone https://github.com/nihalmohammad705-debug/EduTracker.git
cd edutracker
npm install
```

## ⚙️ Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🗄️ Database Setup

```bash
# Log into MySQL
mysql -u root -p
```

```sql
CREATE DATABASE student_ap_tracker;
USE student_ap_tracker;
EXIT;
```

```bash
# Import schema
mysql -u root -p student_ap_tracker < database/schema.sql
```

## ▶️ Running the Application

```bash
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
edutracker/
│
├── config/
│   ├── database.js               # Database connection
│   └── schema.sql                # Database schema
│
├── controllers/
│   ├── authController.js         # Authentication logic
│   ├── studentController.js      # Student operations
│   ├── institutionController.js  # Institution operations
│   ├── analyticsController.js    # Analytics logic
│   └── notificationController.js # Notifications
│
├── middleware/
│   ├── auth.js                   # JWT authentication
│   ├── rateLimit.js              # Rate limiting
│   └── validation.js             # Input validation
│
├── models/
│   ├── Institution.js            # Institution model
│   ├── Student.js                # Student model
│   ├── Semester.js               # Semester model
│   ├── Subject.js                # Subject model
│   └── Notification.js           # Notification model
│
├── public/
│   ├── assets/
│   │   ├── images/                # Logo and images
│   │   └── favicon.svg            # Browser favicon
│   ├── css/
│   │   └── style.css              # Styling
│   └── js/
│       ├── script.js              # Main JS
│       ├── dashboard.js           # Dashboard logic
│       ├── notifications.js       # Notification handling
│       └── socket.js              # Socket.IO client
│
├── routes/
│   ├── auth.js                   # Auth routes
│   ├── students.js               # Student routes
│   ├── analytics.js              # Analytics routes
│   └── notifications.js          # Notification routes
│
├── services/
│   ├── emailService.js           # Email handling
│   └── reportService.js          # Report generation
│
├── utils/
│   └── calculators.js            # SGPA/CGPA calculations
│
├── logs/                         # Application logs
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies
├── server.js                     # Entry point
└── README.md                     # Documentation
```

## 📚 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/student/login` | Student login |
| POST | `/api/auth/student/register` | Student registration |
| POST | `/api/auth/institution/login` | Institution login |
| POST | `/api/auth/institution/register` | Institution registration |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Student Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/student/dashboard` | Get student dashboard |
| GET | `/api/student/rank` | Get student rank |
| GET | `/api/student/profile` | Get profile |
| PUT | `/api/student/profile` | Update profile |
| GET | `/api/student/internal-marks` | Get internal marks |

### Institution Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/institution/students` | Get all students |
| GET | `/api/institution/stats` | Get statistics |
| GET | `/api/institution/student/:usn` | Get student details |
| POST | `/api/institution/add-record` | Add external record |
| POST | `/api/institution/add-internal-record` | Add internal marks |
| PUT | `/api/institution/student/:usn` | Update student |
| DELETE | `/api/institution/student/:usn` | Delete student |
| GET | `/api/institution/departments` | Get departments |
| POST | `/api/institution/departments` | Add department |
| GET | `/api/institution/external-subjects` | Get external subjects |
| POST | `/api/institution/external-subjects` | Add external subject |
| GET | `/api/institution/internal-subjects` | Get internal subjects |
| POST | `/api/institution/internal-subjects` | Add internal subject |

### Analytics Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Get dashboard stats |
| GET | `/api/analytics/department-stats` | Department-wise stats |
| GET | `/api/analytics/semester-performance` | Semester trends |
| GET | `/api/analytics/top-students` | Top performers |

## 📖 Usage Guide

### Institution Portal

1. **Register as an Institution**
   - Click "Institution Portal" on the homepage
   - Click the "Register" tab
   - Fill in institution details
   - Note your Institution ID and USN Prefix

2. **Login**
   - Use your Institution ID and password
   - You'll be redirected to the dashboard

3. **Manage Departments**
   - Go to the "Departments" section
   - Add departments (CSE, ECE, etc.)
   - Configure subjects for each department

4. **Add External Records (SGPA/CGPA)**
   - Go to the "Externals" section
   - Click "Add External Record"
   - Enter student USN and semester details
   - Fill in subject-wise marks — SGPA is calculated automatically

5. **Add Internal Records (IA1/IA2)**
   - Go to the "Internals" section
   - Click "Add Internal Record"
   - Enter marks for IA1 and IA2 (can leave blank if not conducted)

6. **View Analytics**
   - Dashboard shows an overview, department-wise performance charts, semester-wise trends, and a top performers list

### Student Portal

1. **Register**
   - Click "Student Portal" on the homepage
   - Click the "Register" tab
   - Enter your USN (must match institution prefix) and fill in personal details

2. **Login**
   - Use your USN and password
   - Dashboard shows current CGPA, semester-wise SGPA, a performance trend chart, and rank/percentile

3. **View Results**
   - External results show subject-wise marks, credits, grades, and semester SGPA
   - Internal results show IA1 and IA2 marks (best of two, if configured)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

[G Nihal](https://github.com/nihal705)