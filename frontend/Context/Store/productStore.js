import { configureStore } from '@reduxjs/toolkit';
import { 
  productListReducer, 
  productCreateReducer,
  productUpdateReducer,
  productDeleteReducer,
  productReviewsReducer
} from '../Reducers/productReducers';

// Custom middleware for logging
const logger = store => next => action => {
  console.log('Dispatching:', action.type);
  let result = next(action);
  console.log('Next State:', store.getState());
  return result;
};

const store = configureStore({
  reducer: {
    productList: productListReducer,
    productCreate: productCreateReducer,
    productUpdate: productUpdateReducer,
    productDelete: productDeleteReducer,
    productReviews: productReviewsReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(logger)
});

export default store;