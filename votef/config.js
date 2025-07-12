// Environment configuration for the voting system
const config = {
    // Firebase Configuration
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDh60ha_x6ZBFdicTb268kkIECHgAWwlME",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "voterc-c70d1.firebaseapp.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "voterc-c70d1",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "voterc-c70d1.firebasestorage.app",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "488886767779",
        appId: process.env.FIREBASE_APP_ID || "1:488886767779:web:c7abc68d48eed56d776f16",
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-1LVLBJ2JWM"
    },
    
    // Backend API Configuration
    backend: {
        baseUrl: process.env.BACKEND_URL || "http://localhost:3002",
        timeout: 10000
    },
    
    // Feature Flags
    features: {
        firebaseEnabled: process.env.FIREBASE_ENABLED !== "false", // enabled by default
        smsEnabled: process.env.SMS_ENABLED !== "false", // enabled by default
        analyticsEnabled: process.env.ANALYTICS_ENABLED !== "false" // enabled by default
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { config, getFirebaseConfig, isFirebaseEnabled, getBackendUrl };
} else {
    // Browser environment
    window.VoteConfig = { config, getFirebaseConfig, isFirebaseEnabled, getBackendUrl };
} 