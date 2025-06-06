import {
  ADD_TO_CART,
  UPDATE_CART_QUANTITY,
  REMOVE_FROM_CART,
  CLEAR_CART,
  SET_CART_LOADING,
  SET_CART_ERROR,
  SET_CART_COUNT,
  SET_ORDER_COUNT,
  GET_ORDER_LIST_REQUEST,
  GET_ORDER_LIST_SUCCESS,
  GET_ORDER_LIST_FAIL,
  SET_CART_ITEMS
} from '../Constants/CartConstants'

const initialState = {
  cartItems: [],
  loading: false,
  error: null,
  cartCount: 0,
  orderCount: 0,
  orderList: [],
  selectedOrders: []
}

export const cartReducer = (state = initialState, action) => {
  console.log("Cart reducer received action:", action.type, action.payload);
  
  switch (action.type) {
    case ADD_TO_CART:
      return {
        ...state,
        cartItems: [...state.cartItems, action.payload]
      }
    case UPDATE_CART_QUANTITY:
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item._id === action.payload.orderId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    case REMOVE_FROM_CART:
      return {
        ...state,
        orderList: state.orderList.filter(item => item.order_id !== action.payload)
      }
    case SET_CART_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    case SET_CART_ERROR:
      return {
        ...state,
        error: action.payload
      }
    case SET_CART_COUNT:
      console.log('Setting cart count:', action.payload);
      return {
        ...state,
        cartCount: action.payload
      }
    case SET_ORDER_COUNT:
    //   console.log('Reducer - Updating orderCount:', action.payload);
      return {
        ...state,
        orderCount: action.payload
      }
    case GET_ORDER_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        orderList: [] // Clear previous list while loading
      }
    case GET_ORDER_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        orderList: action.payload,
        cartCount: action.payload.reduce((sum, item) => sum + (item.quantity || 0), 0)
      }
    case GET_ORDER_LIST_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        orderList: []
      }
    case 'SET_SELECTED_ORDERS':
      return {
        ...state,
        selectedOrders: action.payload.map(order => ({
          ...order,
          product: {
            ...order.product,
            image: order.product.image || '' // Ensure image is never undefined
          }
        }))
      }
    case 'CLEAR_SELECTED_ORDERS':
      return {
        ...state,
        selectedOrders: []
      }
    case 'CLEAR_CART_DATA':
      return {
        ...initialState
      }
    case SET_CART_ITEMS:
      return {
        ...state,
        cartItems: action.payload,
        cartCount: action.payload.reduce((sum, item) => sum + item.quantity, 0)
      }
    case CLEAR_CART:
      return {
        ...state,
        cartItems: [],
        cartCount: 0
      }
    default:
      return state
  }
}