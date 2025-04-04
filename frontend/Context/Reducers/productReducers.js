import { 
  PRODUCT_LIST_REQUEST, 
  PRODUCT_LIST_SUCCESS, 
  PRODUCT_LIST_FAIL,
  PRODUCT_REVIEWS_REQUEST,
  PRODUCT_REVIEWS_SUCCESS,
  PRODUCT_REVIEWS_FAIL,
  PRODUCT_CREATE_REQUEST,
  PRODUCT_CREATE_SUCCESS,
  PRODUCT_CREATE_FAIL,
  PRODUCT_CREATE_RESET,
  PRODUCT_UPDATE_REQUEST,
  PRODUCT_UPDATE_SUCCESS,
  PRODUCT_UPDATE_FAIL,
  PRODUCT_UPDATE_RESET,
  PRODUCT_DELETE_REQUEST,
  PRODUCT_DELETE_SUCCESS,
  PRODUCT_DELETE_FAIL,
  PRODUCT_DELETE_RESET,
  PRODUCT_REVIEW_REQUEST,
  PRODUCT_REVIEW_SUCCESS,
  PRODUCT_REVIEW_FAIL,
  PRODUCT_REVIEW_RESET,
  CHECK_PURCHASE_REQUEST,
  CHECK_PURCHASE_SUCCESS,
  CHECK_PURCHASE_FAIL
} from '../Constants/ProductConstants';

// Reducer for product list
export const productListReducer = (state = { products: [] }, action) => {
  switch (action.type) {
    case PRODUCT_LIST_REQUEST:
      return { loading: true, products: [] };
    case PRODUCT_LIST_SUCCESS:
      return { loading: false, products: action.payload };
    case PRODUCT_LIST_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_DELETE_SUCCESS:
      return { 
        ...state, 
        products: state.products.filter(product => product._id !== action.payload)
      };
    default:
      return state;
  }
};

// Reducer for product creation
export const productCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_CREATE_REQUEST:
      return { loading: true };
    case PRODUCT_CREATE_SUCCESS:
      return { loading: false, success: true, product: action.payload };
    case PRODUCT_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

// Reducer for product update
export const productUpdateReducer = (state = { product: {} }, action) => {
  switch (action.type) {
    case PRODUCT_UPDATE_REQUEST:
      return { loading: true };
    case PRODUCT_UPDATE_SUCCESS:
      return { loading: false, success: true, product: action.payload };
    case PRODUCT_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_UPDATE_RESET:
      return { product: {} };
    default:
      return state;
  }
};

// Reducer for product deletion
export const productDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_DELETE_REQUEST:
      return { loading: true };
    case PRODUCT_DELETE_SUCCESS:
      return { loading: false, success: true };
    case PRODUCT_DELETE_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_DELETE_RESET:
      return {};
    default:
      return state;
  }
};

// Update the reviews reducer with proper initial state
export const productReviewsReducer = (state = { reviews: [] }, action) => {
  switch (action.type) {
    case PRODUCT_REVIEWS_REQUEST:
      return { ...state, loading: true };
    case PRODUCT_REVIEWS_SUCCESS:
      console.log('Reviews reducer received:', action.payload);
      return { 
        loading: false, 
        reviews: action.payload, 
        error: null 
      };
    case PRODUCT_REVIEWS_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Update the product review reducer with proper initial state
export const productReviewReducer = (state = { canReview: false, checkingPurchase: false }, action) => {
  switch (action.type) {
    case PRODUCT_REVIEW_REQUEST:
      return { ...state, loading: true };
    case PRODUCT_REVIEW_SUCCESS:
      return { ...state, loading: false, success: true };
    case PRODUCT_REVIEW_FAIL:
      return { ...state, loading: false, error: action.payload };
    case PRODUCT_REVIEW_RESET:
      return { canReview: false, checkingPurchase: false };
    case CHECK_PURCHASE_REQUEST:
      return { ...state, checkingPurchase: true };
    case CHECK_PURCHASE_SUCCESS:
      return { ...state, checkingPurchase: false, canReview: action.payload };
    case CHECK_PURCHASE_FAIL:
      return { 
        ...state, 
        checkingPurchase: false, 
        canReview: false, 
        error: action.payload 
      };
    default:
      return state;
  }
};