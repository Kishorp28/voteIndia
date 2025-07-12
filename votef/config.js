// Environment configuration for the voting system
const config = {
    // Firebase Configuration - Load from environment variables
    firebase: {
        apiKey: window.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
        authDomain: window.FIREBASE_AUTH_DOMAIN || "YOUR_FIREBASE_AUTH_DOMAIN",
        projectId: window.FIREBASE_PROJECT_ID || "YOUR_FIREBASE_PROJECT_ID",
        storageBucket: window.FIREBASE_STORAGE_BUCKET || "YOUR_FIREBASE_STORAGE_BUCKET",
        messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
        appId: window.FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID",
        measurementId: window.FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
    },
    
    // Backend API Configuration
    backend: {
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? "http://localhost:3002" 
            : "/.netlify/functions/api",
        timeout: 10000
    },
    
    // Feature Flags
    features: {
        firebaseEnabled: window.FIREBASE_ENABLED !== "false", // enabled by default
        smsEnabled: window.SMS_ENABLED !== "false", // enabled by default
        analyticsEnabled: window.ANALYTICS_ENABLED !== "false" // enabled by default
    }
};

// Function to get Firebase config
function getFirebaseConfig() {
    return config.firebase;
}

// Function to check if Firebase is enabled
function isFirebaseEnabled() {
    return config.features.firebaseEnabled;
}

// Function to get backend URL
function getBackendUrl() {
    return config.backend.baseUrl;
}

// Function to update config from environment (for production)
function updateConfigFromEnvironment() {
    // Check if we're in a production environment
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // In production, we can use environment variables if they're injected
        // For now, we'll use the default config
        console.log('Running in production environment');
    }
}

// Initialize config
updateConfigFromEnvironment();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { config, getFirebaseConfig, isFirebaseEnabled, getBackendUrl };
} else {
    // Browser environment
    window.VoteConfig = { config, getFirebaseConfig, isFirebaseEnabled, getBackendUrl };
} 