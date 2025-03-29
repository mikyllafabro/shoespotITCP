import { Platform } from 'react-native';

let baseURL = '';

if (Platform.OS === 'android') {
    // Update this to match your backend URL structure
baseURL = 'http://192.168.1.100:5000/api/v1';  // Your actual IP address  
} else {
    // For iOS
    baseURL = 'http://localhost:5000/api/v1';
}

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
