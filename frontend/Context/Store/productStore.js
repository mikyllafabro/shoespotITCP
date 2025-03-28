import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // Fix thunk import
import { productListReducer } from '../Reducers/productReducers';

const initialState = {
  productList: {
    loading: false,
    products: [],
    error: null
  }
};

const rootReducer = combineReducers({
  productList: productListReducer
});

// Create store with thunk middleware
const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(thunk)
);

export default store;