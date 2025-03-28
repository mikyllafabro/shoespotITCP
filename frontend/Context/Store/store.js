// import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
// import thunk from 'redux-thunk';
// import authReducer from '../Reducers/Auth.reducer';

// const rootReducer = combineReducers({
//   auth: authReducer,
// });

// const store = createStore(rootReducer, applyMiddleware(thunk));

// export default store;

import { createStore, combineReducers } from 'redux';
import authReducer from '../Reducers/Auth.reducer';

const rootReducer = combineReducers({
  auth: authReducer,
});

// Create store without middleware temporarily
const store = createStore(rootReducer);

export default store;