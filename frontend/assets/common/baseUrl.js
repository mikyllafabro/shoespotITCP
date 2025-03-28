const { Platform } = require('react-native');

let baseURL = '';

if (Platform.OS === 'android') {
    baseURL = 'http://192.168.1.100:5000/api/v1';  // Add /api/v1 to match backend routes
} else if (Platform.OS === 'ios') {
    baseURL = 'http://localhost:5000/api/v1';
} else {
    baseURL = 'http://localhost:5000/api/v1';
}

module.exports = baseURL;
