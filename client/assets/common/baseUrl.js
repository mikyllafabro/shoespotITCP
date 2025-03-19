const { Platform } = require('react-native');

const baseURL = Platform.OS === "android"
    ? "http://192.168.1.59:5000"  // Match backend port
    : "http://localhost:5000";    // For local testing in web/desktop

module.exports = baseURL;
