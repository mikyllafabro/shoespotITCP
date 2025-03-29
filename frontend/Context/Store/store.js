// import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
// import thunk from 'redux-thunk';
// import authReducer from '../Reducers/Auth.reducer';

// const rootReducer = combineReducers({
//   auth: authReducer,
// });

// const store = createStore(rootReducer, applyMiddleware(thunk));

// export default store;

import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import authReducer from '../Reducers/Auth.reducer';

const rootReducer = combineReducers({
  auth: authReducer,
});

const initialState = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  },
  // other initial states
};

// Create store without middleware temporarily
const store = createStore(rootReducer, initialState, composewithDevTools(applyMiddleware(thunkMiddleware)));

export default store;