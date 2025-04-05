import { Platform } from 'react-native';

let baseURL = '';

if (Platform.OS === 'android') {
    baseURL = 'http://192.168.1.58:5000/api/v1';  // Make sure this matches your MongoDB server
} else {
    baseURL = 'http://localhost:5000/api/v1';
}

// Add debugging for API calls
export const logApiCall = (method, endpoint, data = null) => {
    console.log(`API ${method}:`, `${baseURL}${endpoint}`);
    if (data) console.log('Request data:', data);
};

export const axiosConfig = {
    baseURL,
    timeout: 30000,
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
};

// Add debugging helper
export const testNetworkConnection = async () => {
    try {
        console.log('Current baseURL:', baseURL);
        console.log('Platform:', Platform.OS);
        const response = await fetch(baseURL + '/products');
        console.log('Network test response:', response.status);
        return true;
    } catch (error) {
        console.error('Network test failed:', error);
        return false;
    }
};

export default baseURL;
