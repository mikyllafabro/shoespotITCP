const initialState = {
    loading: false,
    error: null,
    reviews: []
  };
  
  export const productReviewsReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'FETCH_REVIEWS_REQUEST':
        return { ...state, loading: true };
      case 'FETCH_REVIEWS_SUCCESS':
        // Process reviews to handle blank userImage values before storing in state
        const processedReviews = action.payload.map(review => {
          if (!review.userImage || review.userImage === '') {
            // Set default user image URL or placeholder
            return {
              ...review,
              userImage: 'https://i.imgur.com/6VBx3io.png' // Default profile placeholder
            };
          }
          return review;
        });
        
        return { ...state, loading: false, reviews: processedReviews };
      case 'FETCH_REVIEWS_FAIL':
        return { ...state, loading: false, error: action.payload };
      default:
        return state;
    }
  };