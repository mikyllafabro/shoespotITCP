import axios from 'axios';
import { Platform } from 'react-native';
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
  PRODUCT_UPDATE_REQUEST,
  PRODUCT_UPDATE_SUCCESS,
  PRODUCT_UPDATE_FAIL,
  PRODUCT_DELETE_REQUEST,
  PRODUCT_DELETE_SUCCESS,
  PRODUCT_DELETE_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL
} from '../Constants/ProductConstants';
import baseURL, { axiosConfig } from '../../assets/common/baseUrl';

// Create axios instance with config
const axiosInstance = axios.create({
  ...axiosConfig,
  // Add additional error handling
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

// Log requests and responses for debugging
axiosInstance.interceptors.request.use(request => {
  console.log('Starting Request:', request.url);
  console.log('Request Data:', request.data);
  return request;
});

axiosInstance.interceptors.response.use(
  response => {
    console.log('Response:', response.data);
    return response;
  },
  error => {
    console.log('Response Error:', error.response || error);
    return Promise.reject(error);
  }
);

// Update the listProducts function
export const listProducts = (searchParams = {}) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_LIST_REQUEST });
    
    console.log('Fetching products from:', `${baseURL}/products`);

    const response = await axios.get(`${baseURL}/products`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Products response:', response.data);

    if (!response.data.success) {
      throw new Error('Failed to fetch products');
    }

    dispatch({
      type: PRODUCT_LIST_SUCCESS,
      payload: response.data.products
    });
  } catch (error) {
    console.error('Error fetching products:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: `${baseURL}/products`
    });

    dispatch({
      type: PRODUCT_LIST_FAIL,
      payload: error.response?.data?.message || 'Failed to fetch products'
    });
  }
};

// Create product action
export const createProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_CREATE_REQUEST });

    const formData = new FormData();
    
    // Add basic product data with explicit number handling
    formData.append('name', productData.name);
    formData.append('price', String(Number(productData.price) || 0));
    formData.append('description', productData.description);
    formData.append('category', productData.category);
    formData.append('stock', String(Number(productData.stock) || 0));
    formData.append('brand', productData.brand);
    formData.append('status', productData.status || 'Available');
    
    // Handle discount explicitly
    const discount = Number(productData.discount) || 0;
    formData.append('discount', String(discount));

    // Calculate and append discounted price
    const price = Number(productData.price) || 0;
    const discountedPrice = +(price * (1 - discount/100)).toFixed(2);
    formData.append('discountedPrice', String(discountedPrice));

    console.log('Sending product data:', {
        price,
        discount,
        discountedPrice
    });

    // Add images if they exist
    if (productData.images?.length > 0) {
      productData.images.forEach((image, index) => {
        formData.append('images', {
          uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
          type: 'image/jpeg',
          name: `image${index}.jpg`
        });
      });
    }

    console.log('Sending product data:', {
      price: productData.price,
      discount: productData.discount,
      formData: Object.fromEntries(formData)
    });

    const response = await axios.post(
      `${baseURL}/admin/product/create`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Create product response:', response.data);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create product');
    }

    // Dispatch success action
    dispatch({
        type: PRODUCT_CREATE_SUCCESS,
        payload: response.data.product
    });

    // Immediately refresh the products list
    await dispatch(listProducts());

    return response.data.product;
  } catch (error) {
    console.error('Create Product Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
    });
    
    dispatch({
        type: PRODUCT_CREATE_FAIL,
        payload: error.response?.data?.message || 'Failed to create product'
    });
    
    throw error;
  }
};

// Update product action
export const updateProduct = (productId, productData) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_UPDATE_REQUEST });

    // Check if there are new images and set up form data if needed
    let config = {};
    let dataToSend = productData;

    if (productData.images && Array.isArray(productData.images) && 
        productData.images.some(img => img.uri && !img.url)) {
      const formData = new FormData();
      
      // Add text fields to form data
      Object.keys(productData).forEach(key => {
        if (key !== 'images') {
          formData.append(key, productData[key]);
        }
      });
      
      // Add existing images info
      const existingImages = productData.images
        .filter(img => img.url && !img.uri)
        .map(img => img.url || img._id);
      
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
      
      // Add new images to form data
      productData.images
        .filter(img => img.uri && !img.url)
        .forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.fileName || `image-${index}.jpg`
          });
        });
      
      dataToSend = formData;
      config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
    }

    // Update route to match backend
    const { data } = await axios.put(`${baseURL}/admin/product/update/${productId}`, dataToSend, config);

    dispatch({
      type: PRODUCT_UPDATE_SUCCESS,
      payload: data.product
    });

    return data.product;
  } catch (error) {
    console.error('Error updating product:', error);
    dispatch({
      type: PRODUCT_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message
    });
    throw error;
  }
};

// Delete product action
export const deleteProduct = (productId) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_DELETE_REQUEST });
    
    console.log('Deleting product:', productId);
    
    const response = await axios.delete(`${baseURL}/admin/product/delete/${productId}`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (!response.data.success) {
        throw new Error(response.data.message || 'Delete failed');
    }

    dispatch({
        type: PRODUCT_DELETE_SUCCESS,
        payload: productId
    });

    return true;
  } catch (error) {
    console.error('Delete product error:', {
        message: error.message,
        response: error.response?.data
    });
    
    dispatch({
        type: PRODUCT_DELETE_FAIL,
        payload: error.response?.data?.message || 'Failed to delete product'
    });
    
    throw error;
  }
};

// Existing fetch product reviews function
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

// Add new action to fetch single product
export const fetchProductDetails = (productId) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_DETAILS_REQUEST });

    console.log('Fetching product details for ID:', productId);
    const response = await axios.get(`${baseURL}/products/${productId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('Product details response:', response.data);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch product details');
    }

    dispatch({
      type: PRODUCT_DETAILS_SUCCESS,
      payload: response.data.product
    });

    return response.data.product;
  } catch (error) {
    console.error('Error fetching product details:', {
      message: error.message,
      response: error.response?.data
    });
    dispatch({
      type: PRODUCT_DETAILS_FAIL,
      payload: error.response?.data?.message || 'Failed to fetch product details'
    });
    throw error;
  }
};

