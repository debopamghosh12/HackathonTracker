// Central API base configuration for frontend
// Replace the production URL below with your deployed backend URL (no trailing slash)
window.API_BASE = (function(){
  // Local development -> talk to local server
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  // PRODUCTION: backend (Render) URL
  return 'https://hackathontracker.onrender.com';
})();

// convenience: API endpoints
window.API = {
  LOGIN: window.API_BASE + '/api/login',
  REGISTER: window.API_BASE + '/api/register',
  VALIDATE: window.API_BASE + '/api/validate',
  HACKATHONS: window.API_BASE + '/api/hackathons',
  USERS: window.API_BASE + '/api/users'
};
