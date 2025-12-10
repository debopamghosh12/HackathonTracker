# 🚀 HackathonTracker

**A modern, feature-rich web application to track and manage hackathon participation, team progress, and event details with a cyberpunk aesthetic.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Authentication & Security](#authentication--security)
- [Team](#team)
- [Contributing](#contributing)

---

## 🎯 Overview

**HackathonTracker** is a sophisticated web application designed to help teams efficiently manage and track their hackathon journey. From registration to final submission, keep all your hackathon events, team details, and progress in one secure, visually stunning dashboard.

Whether you're a student, developer, or organizer, HackathonTracker provides the tools you need to:
- 📝 Register and track multiple hackathons
- 👥 Manage team members and collaboration
- 📊 Monitor event status and deadlines
- 🏆 Keep records of achievements and certificates
- 🔐 Secure access with session management

---

## ✨ Features

### 🔐 Authentication & Security
- **Secure Passcode-Based Login** with SHA-256 hashing
- **Remember Me Functionality** - 30-day persistent sessions with device fingerprinting
- **Auto-Redirect** if valid session exists
- **Session Validation** on every protected page load
- **Clear Session** management on logout

### 📱 User Interface
- **Modern Cyberpunk Design** with glassmorphism effects
- **3D Interactive Background** using Three.js
- **Responsive Layout** - Works seamlessly on desktop, tablet, and mobile
- **Font Awesome Icons** - Professional icon library integration
- **Smooth Animations** - Warp effect, transitions, and confetti celebrations
- **Mobile Menu** - Hamburger navigation for smaller screens

### 📊 Dashboard Features
- **Event Management**
  - View all upcoming hackathons
  - Search and filter by mode (Online/Offline/Hybrid)
  - Real-time event status tracking
  
- **Event Details**
  - Hackathon name, organizer, location, dates
  - Team size and member names
  - Registration status and links
  - Certificate and photos management

- **Edit & Update**
  - Modify event details in modal interface
  - Track current status (Interested, Applied, Shortlisted, Rejected, Winner)
  - Update team information

- **Data Persistence**
  - MongoDB backend for secure data storage
  - API integration for CRUD operations
  - Automatic data synchronization

### 🎉 Interactive Elements
- **Confetti Animation** on winner status
- **Countdown Timers** for upcoming events
- **Status Badges** for quick event overview
- **Modal Editing** for seamless updates

### 👥 Team Page
- **Team Member Profiles**
  - Professional member cards with hover effects
  - Social links (LinkedIn, GitHub, Email)
  - Role descriptions and specializations
  - Responsive team grid layout

---

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Advanced styling with animations and glassmorphism
- **JavaScript (ES6+)** - Interactive features and API calls
- **Three.js** - 3D background animation
- **Font Awesome 6.4.0** - Icon library
- **Canvas Confetti** - Celebration animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin requests

### DevOps
- **Git & GitHub** - Version control
- **Vercel** - Deployment platform
- **Environment Variables** - Secure configuration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/C0D3K0NG/HackathonTracker.git
   cd HackathonTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URL=your_mongodb_connection_string
   PORT=5000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   Navigate to `http://localhost:5000`

### Default Login
- **Passcode**: `bitrise` (SHA-256 hashed)
- Check Remember Me to stay logged in for 30 days

---

## 📁 Project Structure

```
HackathonTracker/
├── index.html              # Add hackathon form
├── login.html              # Secure login interface
├── dashboard.html          # Main event dashboard
├── team.html               # Team member profiles
├── report.html             # Report generation
├── server.js               # Express backend server
├── package.json            # Dependencies and scripts
├── vercel.json             # Deployment configuration
├── assets/
│   └── js/
│       └── sessionManager.js  # Session management utility
├── .env                    # Environment variables (not in repo)
└── README.md               # This file
```

---

## 💻 Usage

### Login
1. Navigate to the login page
2. Enter the passcode
3. Check "Remember this device" to stay logged in
4. Click "INITIALIZE" to access the dashboard

### Add Hackathon Event
1. Click "ADD EVENT" from the dashboard
2. Fill in event details:
   - Hackathon name and organizer
   - Location and mode (Online/Offline/Hybrid)
   - Start and end dates
   - Team information
   - Registration link
3. Click "Save To Hack" to store the event

### Dashboard Management
1. **Search**: Use the search box to find hackathons
2. **Filter**: Sort by event mode
3. **Edit**: Click the edit icon to modify event details
4. **Delete**: Remove events from your list
5. **View**: Check event links and details

### Team Page
- Click "TEAM" to view team member profiles
- See roles, specializations, and social links
- Share team information with others

---

## 🔐 Authentication & Security

### Session Management
The application uses a robust session management system:

- **Device Fingerprinting**: Sessions are tied to the device/browser
- **Persistent Sessions**: 30-day expiry when "Remember Me" is checked
- **Temporary Sessions**: Cleared on browser close if not remembered
- **Session Validation**: Checked on every protected page load
- **Secure Logout**: Clears all session data

### Password Security
- SHA-256 hashing for password verification
- No plaintext passwords stored
- Passcode validation on each login attempt

### CORS Protection
- Configured CORS for secure API requests
- Only allow requests from authorized origins

---

## 👥 Team

**BitRise** - The Creative Force Behind HackathonTracker

### Team Members

#### 🔧 Debopam Ghosh
- **Role**: Backend Systems and Machine Learning
- **Skills**: Backend Development, Machine Learning, DevOps
- **Links**: [LinkedIn](https://www.linkedin.com/in/debopam-ghosh12) | [GitHub](https://github.com/debopamghosh12) | [Email](mailto:debopamghosh2004@gmail.com)

#### 💻 Rajdeep Saha
- **Role**: Python Developer and CyberSecurity Expert
- **Skills**: Python, Offensive Security, Automation, GFG Ambassador
- **Links**: [LinkedIn](https://www.linkedin.com/in/rajdeep-saha-b92452292/) | [GitHub](https://github.com/C0D3K0NG) | [Email](mailto:1rajofficial0@gmail.com)

#### 🛡️ Harsvardhan Rajgarhia
- **Role**: Backend Ninja
- **Skills**: Database Architecture, Server Security
- **Links**: [LinkedIn](#) | [GitHub](#) | [Email](mailto:your-email@gmail.com)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Areas
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements

---

## 📄 License

This project is private and owned by BitRise team. All rights reserved.

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact team members directly
- Check documentation for FAQs

---

## 🎓 Learn More

### Technologies Used
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Font Awesome Icons](https://fontawesome.com/)

### Deploy on Vercel
This project is configured for Vercel deployment. Push to main branch to auto-deploy.

---

## 🚀 Future Enhancements

- [ ] AI-powered hackathon recommendations
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Submission tracking and evaluation
- [ ] Prize distribution management
- [ ] Mobile app (React Native)
- [ ] Internationalization (i18n)
- [ ] Dark mode toggle

---

## ❤️ Made with Love by BitRise

**HackathonTracker** - Your journey to hackathon success starts here! 🚀

```
╔════════════════════════════════════════╗
║   BITRISE - CREATING THE FUTURE        ║
║   One Hackathon at a Time              ║
╚════════════════════════════════════════╝
```

---

**Last Updated**: December 10, 2025  
**Version**: 2.5  
**Status**: 🟢 Active & Maintained
