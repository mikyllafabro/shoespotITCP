import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Rating } from 'react-native-ratings';
import { useDispatch } from 'react-redux';
import { createProductReview } from '../../Context/Actions/productActions';
import axios from 'axios';
import baseURL from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';

const ReviewModal = ({ visible, onClose, productId, productName, productImage, existingReview }) => {
    const dispatch = useDispatch();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [reviewData, setReviewData] = useState(null);

    // Initialize review data if editing an existing review
    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment);
            setIsEditing(true);
            setReviewData(existingReview);
        } else if (productId && visible) {
            fetchExistingReview();
        }
    }, [existingReview, productId, visible]);

    // Reset form when modal is closed
    useEffect(() => {
        if (!visible) {
            if (!existingReview) {
                setRating(0);
                setComment('');
            }
            setLoading(false);
        }
    }, [visible, existingReview]);

    const fetchExistingReview = async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('jwt');
            
            if (!token) {
                console.log('No token found');
                setLoading(false);
                return;
            }

            console.log(`Fetching review for product: ${productId}`);
            
            // First try to get the review directly
            try {
                const response = await axios.get(
                    `${baseURL}/product/${productId}/my-review`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Existing review response:', response.data);

                if (response.data.success && response.data.review) {
                    // User has already reviewed this product
                    const review = response.data.review;
                    setRating(review.rating);
                    setComment(review.comment);
                    setIsEditing(true);
                    setReviewData(review);
                }
            } catch (directError) {
                console.log('Error with direct review fetch:', directError);
                
                // If direct fetch fails, try getting all user reviews
                try {
                    const allReviewsResponse = await axios.get(
                        `${baseURL}/product/user-reviews`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    if (allReviewsResponse.data.success && allReviewsResponse.data.reviews) {
                        // Find the review for this product
                        const reviewForProduct = allReviewsResponse.data.reviews.find(
                            item => item.productId === productId
                        );
                        
                        if (reviewForProduct && reviewForProduct.review) {
                            setRating(reviewForProduct.review.rating);
                            setComment(reviewForProduct.review.comment);
                            setIsEditing(true);
                            setReviewData(reviewForProduct.review);
                            return;
                        }
                    }
                    
                    // No review found in all reviews
                    setRating(0);
                    setComment('');
                    setIsEditing(false);
                    setReviewData(null);
                    
                } catch (allReviewsError) {
                    console.log('Error fetching all reviews:', allReviewsError);
                    // No review exists
                    setRating(0);
                    setComment('');
                    setIsEditing(false);
                    setReviewData(null);
                }
            }
        } catch (error) {
            console.log('Error in fetchExistingReview:', error);
            setRating(0);
            setComment('');
            setIsEditing(false);
            setReviewData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Check for valid product ID
        if (!productId) {
            Alert.alert('Error', 'Product ID not found. Please try again from the product page.');
            onClose();
            return;
        }
        
        // Validate rating and comment
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }
        
        if (comment.trim().length < 5) {
            Alert.alert('Error', 'Please write a comment (minimum 5 characters)');
            return;
        }

        try {
            setLoading(true);
            // Determine if we're updating or creating
            const reviewId = existingReview?._id || reviewData?._id;
            
            console.log(isEditing ? 'Updating review' : 'Creating new review', {
                productId,
                reviewId,
                rating,
                comment
            });
            
            // Submit the review with the product ID and reviewId if editing
            await dispatch(createProductReview(
                productId, 
                { rating, comment }, 
                reviewId
            ));
            
            Alert.alert(
                'Success', 
                isEditing ? 'Your review has been updated!' : 'Your review has been submitted!'
            );
            onClose();
            
            // Reset form only for new reviews
            if (!existingReview && !reviewData) {
                setRating(0);
                setComment('');
            }
        } catch (error) {
            console.error('Review submission error:', error);
            Alert.alert('Error', 'Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4CAF50" />
                                <Text style={styles.loadingText}>
                                    {isEditing ? 'Updating your review...' : 'Loading review data...'}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.title}>
                                    {isEditing ? 'Edit Your Review' : 'Write a Review'}
                                </Text>
                                
                                {/* Product Information */}
                                {productName && (
                                    <View style={styles.productInfo}>
                                        {productImage && (
                                            <Image 
                                                source={{ uri: productImage }}
                                                style={styles.productImage}
                                                defaultSource={require('../../assets/logo.png')}
                                            />
                                        )}
                                        <Text style={styles.productName}>{productName}</Text>
                                    </View>
                                )}
                                
                                <Rating
                                    showRating
                                    onFinishRating={setRating}
                                    style={styles.rating}
                                    startingValue={rating}
                                />

                                <TextInput
                                    style={[styles.input, isEditing ? styles.editingInput : styles.newInput]}
                                    placeholder="Write your review here..."
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    numberOfLines={4}
                                />

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.submitButton]}
                                        onPress={handleSubmit}
                                    >
                                        <Text style={styles.buttonText}>
                                            {isEditing ? 'Update Review' : 'Submit Review'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 500,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 4,
        marginRight: 10,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    rating: {
        paddingVertical: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
        textAlignVertical: 'top',
    },
    newInput: {
        minHeight: 150,
    },
    editingInput: {
        minHeight: 100,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#666',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4CAF50',
    },
});

export default ReviewModal;
