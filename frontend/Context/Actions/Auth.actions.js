export const LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";
export const REGISTER_SUCCESS = "REGISTER_SUCCESS";
export const SET_CURRENT_USER = "SET_CURRENT_USER";
export const SET_CART_LOADING = "SET_CART_LOADING";
export const SET_CART_ERROR = "SET_CART_ERROR";

// Auth action creators
export const login = (userData) => {
  const user = userData.user || userData;
  return {
    type: LOGIN,
    payload: {
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        firebaseUid: user.firebaseUid,
        status: user.status,
        userImage: user.userImage
      },
      token: userData.token
    }
  };
};

export const setCurrentUser = (userData) => {
  return {
    type: SET_CURRENT_USER,
    payload: {
      user: userData.user,
      token: userData.token
    }
  };
};

export const logout = () => {
  return {
    type: LOGOUT
  };
};

export const registerSuccess = (userData) => {
    return {
      type: REGISTER_SUCCESS,
      payload: userData
    };
};

export const setCartLoading = (isLoading) => ({
  type: SET_CART_LOADING,
  payload: isLoading
});

export const setCartError = (error) => ({
  type: SET_CART_ERROR,
  payload: error
});

export const getUserProfile = async () => {
  try {
    const token = await SecureStore.getItemAsync('jwt');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const userData = await SecureStore.getItemAsync('user');
    if (!userData) {
      throw new Error('No user data found');
    }

    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};