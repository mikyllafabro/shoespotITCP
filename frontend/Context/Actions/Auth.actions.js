export const LOGIN = "LOGIN";
export const LOGOUT = "LOGOUT";
export const REGISTER_SUCCESS = "REGISTER_SUCCESS";
export const SET_CURRENT_USER = "SET_CURRENT_USER";

// Auth action creators
export const login = (userData) => async (dispatch) => {
  try {
    // dispatch({ type: "LOGIN_REQUEST" });

    console.log("Dispatching SET_CURRENT_USER with payload:", payload);
    dispatch({
    type: LOGIN,
    payload: userData
    });
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    const data = await res.json();

    if (res.ok) {
      dispatch({ type: "LOGIN_SUCCESS", payload: data.user });
      localStorage.setItem("token", data.token); // Store token for persistence
    } else {
      dispatch({ type: "LOGIN_FAIL", payload: data.message });
    }
  } catch (error) {
    dispatch({ type: "LOGIN_FAIL", payload: error.message });
  }
};
  
export const setCurrentUser = (userData) => {
  return {
    type: SET_CURRENT_USER,
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