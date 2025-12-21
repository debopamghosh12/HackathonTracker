/**
 * Session Manager - Handles user session and "Remember Me" functionality
 * Manages session IDs, expiry, and authentication checks
 */

const SessionManager = {
    SESSION_EXPIRY_DAYS: 30,
    SESSION_KEY: 'sessionId',
    TIMESTAMP_KEY: 'sessionTimestamp',
    AUTH_KEY: 'isTeamMember',
    AUTH_TOKEN_KEY: 'authToken',
    AUTH_ROLE_KEY: 'authRole',

    /**
     * Generate a unique session ID
     * @returns {string} Unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 15);
        const device = this.getDeviceFingerprint();
        return `session_${timestamp}_${randomStr}_${device}`;
    },

    /**
     * Get device fingerprint for added security
     * @returns {string} Device fingerprint
     */
    getDeviceFingerprint() {
        const userAgent = navigator.userAgent;
        const screen = `${window.screen.width}x${window.screen.height}`;
        const timezone = new Date().getTimezoneOffset();
        const str = `${userAgent}${screen}${timezone}`;
        
        // Simple hash
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).substring(0, 8);
    },

    /**
     * Save session to localStorage
     * @param {string} sessionId - The session ID to save
     */
    saveSession(sessionId) {
        localStorage.setItem(this.SESSION_KEY, sessionId);
        localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
        localStorage.setItem(this.AUTH_KEY, 'true');
        sessionStorage.setItem(this.SESSION_KEY, sessionId);
    },

    /**
     * Save server-issued auth token and role
     * @param {string} token
     * @param {string} role
     * @param {boolean} persistent
     */
    saveAuth(token, role, persistent = false) {
        if (persistent) {
            localStorage.setItem(this.AUTH_TOKEN_KEY, token);
            localStorage.setItem(this.AUTH_ROLE_KEY, role);
        } else {
            sessionStorage.setItem(this.AUTH_TOKEN_KEY, token);
            sessionStorage.setItem(this.AUTH_ROLE_KEY, role);
        }
    },

    /**
     * Validate if a session is still active
     * @returns {boolean} True if session is valid
     */
    validateSession() {
        const sessionId = localStorage.getItem(this.SESSION_KEY);
        const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
        
        if (!sessionId || !timestamp) {
            return false;
        }
        
        // Calculate session age
        const SESSION_EXPIRY_MS = this.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const currentTime = Date.now();
        const sessionAge = currentTime - parseInt(timestamp);
        
        // Check if session has expired
        if (sessionAge > SESSION_EXPIRY_MS) {
            this.clearSession();
            return false;
        }
        
        // Validate device fingerprint
        if (!this.validateDeviceFingerprint(sessionId)) {
            this.clearSession();
            return false;
        }
        
        return true;
    },

    /**
     * Validate device fingerprint from session ID
     * @param {string} sessionId - Session ID to validate
     * @returns {boolean} True if device fingerprint matches
     */
    validateDeviceFingerprint(sessionId) {
        const parts = sessionId.split('_');
        if (parts.length < 4) return false;
        
        const storedDevice = parts[3];
        const currentDevice = this.getDeviceFingerprint();
        
        return storedDevice === currentDevice;
    },

    /**
     * Get current session ID
     * @returns {string|null} Current session ID or null
     */
    getSessionId() {
        return localStorage.getItem(this.SESSION_KEY) || sessionStorage.getItem(this.SESSION_KEY);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        // Prefer token-based auth (server-issued)
        const token = sessionStorage.getItem(this.AUTH_TOKEN_KEY) || localStorage.getItem(this.AUTH_TOKEN_KEY);
        if (token) return true;

        // Fallback to legacy sessionId/team member flag
        const hasAuth = localStorage.getItem(this.AUTH_KEY) === 'true';
        const hasSession = sessionStorage.getItem(this.SESSION_KEY) || localStorage.getItem(this.SESSION_KEY);
        if (!hasAuth || !hasSession) return false;
        if (localStorage.getItem(this.SESSION_KEY)) return this.validateSession();
        return true;
    },

    getRole() {
        return sessionStorage.getItem(this.AUTH_ROLE_KEY) || localStorage.getItem(this.AUTH_ROLE_KEY) || null;
    },

    getToken() {
        return sessionStorage.getItem(this.AUTH_TOKEN_KEY) || localStorage.getItem(this.AUTH_TOKEN_KEY) || null;
    },

    /**
     * Clear all session data
     */
    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.TIMESTAMP_KEY);
        localStorage.removeItem(this.AUTH_KEY);
        sessionStorage.removeItem(this.SESSION_KEY);
        // remove auth token/role as well
        localStorage.removeItem(this.AUTH_TOKEN_KEY);
        localStorage.removeItem(this.AUTH_ROLE_KEY);
        sessionStorage.removeItem(this.AUTH_TOKEN_KEY);
        sessionStorage.removeItem(this.AUTH_ROLE_KEY);
    },

    /**
     * Refresh session timestamp (extend expiry)
     */
    refreshSession() {
        if (localStorage.getItem(this.SESSION_KEY)) {
            localStorage.setItem(this.TIMESTAMP_KEY, Date.now().toString());
        }
    },

    /**
     * Get session info for debugging
     * @returns {object} Session info
     */
    getSessionInfo() {
        const sessionId = this.getSessionId();
        const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
        const isAuth = this.isAuthenticated();
        
        return {
            sessionId: sessionId ? sessionId.substring(0, 20) + '...' : null,
            isAuthenticated: isAuth,
            sessionAge: timestamp ? Math.floor((Date.now() - parseInt(timestamp)) / 1000 / 60) + ' minutes' : null,
            isPersistent: !!localStorage.getItem(this.SESSION_KEY)
        };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
