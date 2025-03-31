// import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
// import thunk from 'redux-thunk';
// import authReducer from '../Reducers/Auth.reducer';

// const rootReducer = combineReducers({
//   auth: authReducer,
// });

// const store = createStore(rootReducer, applyMiddleware(thunk));

// export default store;

import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import authReducer from '../Reducers/Auth.reducer';
import { productListReducer } from '../Reducers/productReducers'
import { composeWithDevTools } from 'redux-devtools-extension';

const rootReducer = combineReducers({
  auth: authReducer,
  productList: productListReducer,
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
const store = createStore(rootReducer, initialState, composeWithDevTools(applyMiddleware(thunk)));

export default store;