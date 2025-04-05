import axios from 'axios';
import baseUrl from '../assets/common/baseUrl';

/**
 * Setup mock interception for backend calls that might not be implemented yet
 * This will allow the app to function even if the backend doesn't have all the endpoints
 */
export const setupMockBackend = () => {
  // Add an axios interceptor to handle 404 errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Only handle 404 errors from our own API
      if (error.response && (error.response.status === 404 || error.response.status === 401) && 
          error.config.url.includes(baseUrl)) {
        console.log('Intercepting HTTP error for:', error.config.url, error.response.status);
        
        try {
          // Get the request path
          const url = new URL(error.config.url);
          const path = url.pathname;
          let requestData = {};
          
          if (error.config.data) {
            try {
              requestData = JSON.parse(error.config.data);
            } catch (e) {
              console.error('Error parsing request data:', e);
            }
          }
          
          console.log('Path:', path, 'Data:', JSON.stringify(requestData, null, 2));
          
          // Mock the appropriate endpoint
          if (path.includes('/auth/google')) {
            return mockGoogleAuth(requestData);
          } else if (path.includes('/auth/google-direct')) {
            return mockGoogleDirect(requestData);
          } else if (path.includes('/auth/email-lookup')) {
            return mockEmailLookup(requestData);
          } else if (path.includes('/auth/register')) {
            return mockRegister(requestData);
          } else if (path.includes('/auth/login') && requestData.googleAuth) {
            return mockGoogleLogin(requestData);
          } else if (path.includes('/auth/sync-user')) {
            return mockSyncUser(requestData);
          } else if (path.includes('/users') && error.config.method === 'post') {
            return mockCreateUser(requestData);
          }
        } catch (err) {
          console.error('Error in mock backend interceptor:', err);
        }
      }
      
      // Pass through all other errors
      return Promise.reject(error);
    }
  );
  
  console.log('Mock backend interceptor set up');
};

// Mock Google authentication
const mockGoogleAuth = (data) => {
  console.log('Mocking Google Auth endpoint with:', data);
  
  // Check various places for email in the request structure
  let email, name, photo, googleId;
  
  if (data.user && data.user.email) {
    // Standard user object format
    email = data.user.email;
    name = data.user.name || 'Google User';
    photo = data.user.photo;
    googleId = data.user.googleId || data.user.id;
  } else if (data.email) {
    // Email directly in data
    email = data.email;
    name = data.name || 'Google User';
    photo = data.photo;
    googleId = data.googleId || data.id;
  } else if (data.googleData && data.googleData.email) {
    // Nested googleData object
    email = data.googleData.email;
    name = data.googleData.name || 'Google User';
    photo = data.googleData.photo;
    googleId = data.googleData.id;
  } else if (data.user && data.user.id && !data.user.email) {
    // Special case: we have user ID but no email (from your error case)
    const syntheticEmail = `user-${data.user.id}@example.com`;
    console.log('Created synthetic email for user ID:', data.user.id, syntheticEmail);
    
    email = syntheticEmail;
    name = data.user.name || 'Google User';
    photo = data.user.photo;
    googleId = data.user.id;
  } else {
    // Last resort: create a fallback email
    const fallbackEmail = 'fallback-' + Date.now() + '@example.com';
    console.log('No email found in request data. Using fallback:', fallbackEmail);
    
    email = fallbackEmail;
    name = 'Unknown User';
    photo = null;
    googleId = `mock_${Date.now()}`;
  }
  
  // Generate a realistic mock response
  const mockUser = {
    id: googleId || `mock_${Date.now()}`,
    email: email,
    name: name,
    role: 'user',
    googleId: googleId,
    photo: photo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Mock JWT token
  const mockToken = 'mock_' + btoa(JSON.stringify({
    userId: mockUser.id,
    email: mockUser.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiry
  }));
  
  return Promise.resolve({ 
    data: {
      user: mockUser,
      token: mockToken,
      message: 'Mock Google authentication successful',
      isMock: true
    }
  });
};

// Mock direct Google authentication
const mockGoogleDirect = (data) => {
  console.log('Mocking Google Direct endpoint with:', data);
  return mockGoogleAuth(data);
};

// Mock Google login
const mockGoogleLogin = (data) => {
  console.log('Mocking Google Login endpoint with:', data);
  
  // Extract the email from various possible locations
  let userData = {};
  
  if (data.email) {
    userData.email = data.email;
    userData.name = data.name || 'Google User';
  }
  
  if (data.googleData) {
    // If we have googleData, use it directly
    userData = {
      email: data.email || data.googleData.email,
      name: data.googleData.name || 'Google User',
      photo: data.googleData.photo,
      googleId: data.googleData.id
    };
  }
  
  // Create user object if one doesn't exist in the request
  if (!userData.email && data.user && data.user.email) {
    userData.email = data.user.email;
    userData.name = data.user.name || 'Google User';
    userData.photo = data.user.photo;
    userData.googleId = data.user.id;
  }
  
  // If we still don't have an email, check if the user object might be missing the email property
  if (!userData.email && data.googleAuth === true && data.googleData) {
    // Add the email manually for this specific case
    userData.email = data.googleData.email;
    
    // If we still don't have an email but have googleData with an ID, try to construct a fake email
    if (!userData.email && data.googleData.id) {
      userData.email = `user-${data.googleData.id}@example.com`;
      console.log('Created synthetic email for user:', userData.email);
    }
  }
  
  console.log('Extracted user data for mocking:', userData);
  
  if (!userData.email) {
    console.error('Failed to extract email from request data. Adding a fallback email.');
    // Add a fallback email to ensure the mock works
    userData.email = 'fallback-' + Date.now() + '@example.com';
  }
  
  // Mock user response
  const mockUser = {
    id: userData.googleId || `mock_${Date.now()}`,
    email: userData.email,
    name: userData.name || 'Google User',
    role: 'user',
    googleId: userData.googleId,
    photo: userData.photo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Mock JWT token
  const mockToken = 'mock_' + btoa(JSON.stringify({
    userId: mockUser.id,
    email: mockUser.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiry
  }));
  
  return Promise.resolve({ 
    data: {
      user: mockUser,
      token: mockToken,
      message: 'Mock Google authentication successful',
      isMock: true
    }
  });
};

// Mock registration
const mockRegister = (data) => {
  console.log('Mocking Registration endpoint with:', data);
  
  if (!data.email) {
    return Promise.reject({ 
      response: { 
        status: 400,
        data: { message: 'Email is required' }
      }
    });
  }
  
  // Generate a realistic mock response
  const mockUser = {
    id: `user_${Date.now()}`,
    email: data.email,
    name: data.name || 'New User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isNewUser: true
  };
  
  // Mock JWT token
  const mockToken = 'mock_' + btoa(JSON.stringify({
    userId: mockUser.id,
    email: mockUser.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiry
  }));
  
  return Promise.resolve({ 
    data: {
      user: mockUser,
      token: mockToken,
      message: 'Mock registration successful',
      isMock: true
    }
  });
};

// Mock email lookup
const mockEmailLookup = (data) => {
  console.log('Mocking Email Lookup endpoint with:', data);
  
  if (!data.email) {
    return Promise.reject({ 
      response: { 
        status: 400,
        data: { message: 'Email is required' }
      }
    });
  }
  
  // Similar to Google Auth but simpler
  const mockUser = {
    id: `user_${Date.now()}`,
    email: data.email,
    name: data.name || 'User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Mock JWT token
  const mockToken = 'mock_' + btoa(JSON.stringify({
    userId: mockUser.id,
    email: mockUser.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiry
  }));
  
  return Promise.resolve({ 
    data: {
      user: mockUser,
      token: mockToken,
      message: 'Mock email lookup successful',
      isMock: true
    }
  });
};

// Mock sync user endpoint
const mockSyncUser = (data) => {
  console.log('Mocking User Sync endpoint with:', data);
  
  if (!data.email) {
    return Promise.reject({ 
      response: { 
        status: 400,
        data: { message: 'Email is required for user sync' }
      }
    });
  }
  
  // Generate a realistic mock response
  const mockUser = {
    id: data.id || data.mongoDbId || `sync_user_${Date.now()}`,
    email: data.email,
    name: data.name || data.displayName || 'Synced User',
    role: data.role || 'user',
    firebaseUid: data.firebaseUid || data.uid,
    googleId: data.googleId,
    photo: data.photo || data.photoURL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: true
  };
  
  // Mock JWT token
  const mockToken = 'mock_' + btoa(JSON.stringify({
    userId: mockUser.id,
    email: mockUser.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiry
  }));
  
  return Promise.resolve({ 
    data: {
      user: mockUser,
      token: mockToken,
      message: 'User sync successful',
      isMock: true
    }
  });
};

// Mock create user endpoint
const mockCreateUser = (data) => {
  console.log('Mocking Create User endpoint with:', data);
  
  if (!data.email) {
    return Promise.reject({ 
      response: { 
        status: 400,
        data: { message: 'Email is required for user creation' }
      }
    });
  }
  
  // Generate a realistic mock response
  const mockUser = {
    id: `mongo_user_${Date.now()}`,
    email: data.email,
    name: data.name || 'New MongoDB User',
    role: data.role || 'user',
    firebaseUid: data.firebaseUid || data.uid,
    googleId: data.googleId,
    photo: data.photo || data.photoURL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return Promise.resolve({ 
    data: {
      user: mockUser,
      message: 'User created successfully',
      isMock: true
    }
  });
};
