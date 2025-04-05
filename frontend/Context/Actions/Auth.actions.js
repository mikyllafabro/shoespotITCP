export const LOGIN = "LOGIN";
export const LOGIN_FAIL = "LOGIN_FAIL";
export const LOGOUT = "LOGOUT";
export const REGISTER_SUCCESS = "REGISTER_SUCCESS";
export const SET_CURRENT_USER = "SET_CURRENT_USER";
export const SET_CART_LOADING = "SET_CART_LOADING";
export const SET_CART_ERROR = "SET_CART_ERROR";
export const GOOGLE_LOGIN_SUCCESS = "GOOGLE_LOGIN_SUCCESS";

// Auth action creators
export const login = (userData) => {
  return {
    type: LOGIN,
    payload: {
      user: userData?.user || userData,
      token: userData?.token || null
    }
  };
};

export const loginFail = (error) => ({
  type: LOGIN_FAIL,
  payload: error
});

export const setCurrentUser = (userData) => ({
  type: SET_CURRENT_USER,
  payload: {
    user: userData?.user || null,
    token: userData?.token || null,
    isAuthenticated: Boolean(userData?.user)
  }
});

export const logout = () => ({
  type: LOGOUT
});

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

export const googleLoginSuccess = (userData) => {
  return {
    type: GOOGLE_LOGIN_SUCCESS,
    payload: {
      user: userData.user,
      token: userData.token
    }
  };
};

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