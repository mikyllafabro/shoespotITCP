import axios from 'axios';
import { PRODUCT_LIST_REQUEST, 
        PRODUCT_LIST_SUCCESS, 
        PRODUCT_LIST_FAIL, 
        PRODUCT_REVIEWS_REQUEST, 
        PRODUCT_REVIEWS_SUCCESS, 
        PRODUCT_REVIEWS_FAIL 
} from '../Constants/ProductConstants';
import baseURL from '../../assets/common/baseUrl';

export const listProducts = (searchParams = {}) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_LIST_REQUEST });
    
    const queryParams = new URLSearchParams();
    
    // Handle search parameters
    if (searchParams.keyword) {
      queryParams.append('keyword', searchParams.keyword);
    }
    
    // Handle brand/category filter - change from brand to category
    if (searchParams.brand) {
      queryParams.append('brand', searchParams.brand);
    }
    
    // Handle price range
    if (searchParams.price) {
      if (searchParams.price.min) queryParams.append('price[gte]', searchParams.price.min);
      if (searchParams.price.max) queryParams.append('price[lte]', searchParams.price.max);
    }

    const url = `${baseURL}/products?${queryParams.toString()}`;
    console.log('Fetching products with URL:', url);
    
    const { data } = await axios.get(url);

    dispatch({ 
      type: PRODUCT_LIST_SUCCESS,
      payload: data.products 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    dispatch({
      type: PRODUCT_LIST_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const fetchProductReviews = (productId) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_REVIEWS_REQUEST });

    const { data } = await axios.get(`${baseURL}/product/${productId}/reviews`);

    if (data.success) {
      dispatch({
        type: PRODUCT_REVIEWS_SUCCESS,
        payload: data.reviews
      });
    } else {
      throw new Error('Failed to fetch reviews');
    }
  } catch (error) {
    dispatch({
      type: PRODUCT_REVIEWS_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};