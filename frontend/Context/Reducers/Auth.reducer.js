import { LOGIN, LOGOUT, REGISTER_SUCCESS } from "../Actions/Auth.actions";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: false,
        loading: false,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
      case 'SET_LOADING':
        return {
          ...state,
          loading: action.payload,
        };
    default:
      return state;
  }
};

export default authReducer;