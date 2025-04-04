import { configureStore } from '@reduxjs/toolkit';
import { 
  productListReducer, 
  productCreateReducer,
  productUpdateReducer,
  productDeleteReducer,
  productReviewsReducer,
  productReviewReducer
} from '../Reducers/productReducers';

// Custom middleware for logging
const logger = store => next => action => {
  console.log('Dispatching:', action.type);
  let result = next(action);
  console.log('Next State:', store.getState());
  return result;
};

const initialState = {
  productList: { products: [] },
  productCreate: {},
  productUpdate: { product: {} },
  productDelete: {},
  productReviews: { reviews: [], loading: false, error: null },
  productReview: { canReview: false, checkingPurchase: false, loading: false, error: null }
};

const store = configureStore({
  reducer: {
    productList: productListReducer,
    productCreate: productCreateReducer,
    productUpdate: productUpdateReducer,
    productDelete: productDeleteReducer,
    productReviews: productReviewsReducer,
    productReview: productReviewReducer
  },
  preloadedState: initialState,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(logger)
});

export default store;