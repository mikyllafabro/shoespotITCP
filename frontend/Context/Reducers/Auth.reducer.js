import { LOGIN, LOGIN_FAIL, LOGOUT, SET_CURRENT_USER } from "../Actions/Auth.actions";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  token: null,
  error: null
};

export const authReducer = (state = initialState, action = {}) => {
  switch (action?.type) {
    case LOGIN:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case LOGIN_FAIL:
      return {
        ...state,
        error: action.payload,
        isAuthenticated: false,
        loading: false
      };

    case LOGOUT:
      return initialState;

    case SET_CURRENT_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        loading: false
      };

    default:
      return state;
  }
};

export default authReducer;