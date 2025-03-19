export const LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";
export const REGISTER_SUCCESS = "REGISTER_SUCCESS";

// Auth action creators
export const login = (userData) => {
    return {
      type: LOGIN,
      payload: userData
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