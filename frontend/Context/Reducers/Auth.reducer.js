import { LOGIN, LOGIN_FAIL, LOGOUT, SET_CURRENT_USER, REGISTER_SUCCESS } from "../Actions/Auth.actions";

const initialState = {
  user: null,
  isAuthenticated: false,
  // loading: true,
  token: null,
};

  export const authReducer = (state = initialState, action) => {
    console.log("Auth reducer received action:", action.type, action.payload);
    
  switch (action.type) {
      case LOGIN:
        return {
          ...state,
          user: action.payload,
          isAuthenticated: true
          // Note: We're not setting isAuthenticated here because that's done by SET_CURRENT_USER
        };
        case LOGIN_FAIL:
      // Fix: Handle the case when payload might not exist
      return {
        ...state,
        // loading: false,
        error: action.payload || "Login failed",
        isAuthenticated: false
      };
      case SET_CURRENT_USER:
        console.log("SET_CURRENT_USER action received with payload:", action.payload);
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true
        };
    case REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
      }
      default:
        return state;
  }
}

export default authReducer;