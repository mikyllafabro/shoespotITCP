import { LOGIN, LOGIN_FAIL, LOGOUT, SET_CURRENT_USER, REGISTER_SUCCESS, SET_CART_LOADING, SET_CART_ERROR } from "../Actions/Auth.actions";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  token: null,
  error: null,
  cartLoading: false,
  cartError: null
};

export const authReducer = (state = initialState, action) => {
  console.log("Auth reducer received action:", action.type, action.payload);
    
  switch (action.type) {
    case LOGIN:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
        cartError: null
      };
    case LOGIN_FAIL:
      return {
        ...state,
        error: action.payload || "Login failed",
        isAuthenticated: false,
        loading: false
      };
    case SET_CURRENT_USER:
      console.log("SET_CURRENT_USER action received with payload:", action.payload);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case SET_CART_LOADING:
      return {
        ...state,
        cartLoading: action.payload
      };
    case SET_CART_ERROR:
      return {
        ...state,
        cartError: action.payload,
        cartLoading: false
      };
    default:
      return state;
  }
}

export default authReducer;