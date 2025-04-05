import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkCanReviewProduct, fetchProductReviews } from '../../Context/Actions/productActions';
import CartModal from '../Modals/CartModal';
import OrderModal from '../Modals/OrderModal';
import ReviewModal from '../Modals/ReviewModal';
import * as SecureStore from 'expo-secure-store';  // Add SecureStore import

const { width } = Dimensions.get('window');

const ProductDetails = ({ route, navigation }) => {
    const dispatch = useDispatch();
    const { product } = route.params;
    const [showCartModal, setShowCartModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);

    // Update selectors to handle undefined state
    const productReviews = useSelector(state => state.productReviews || { reviews: [], loading: false });
    const { reviews = [], loading: reviewsLoading = false } = productReviews;
    const { canReview = false } = useSelector(state => state.productReview || {});

    // Fetch user info on mount
    useEffect(() => {
        const getUserId = async () => {
            try {
                const userData = await SecureStore.getItemAsync('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setCurrentUser(user);
                }
            } catch (error) {
                console.error('Error getting user data:', error);
            }
        };
        getUserId();
    }, []);

    useEffect(() => {
        if (product?._id) {
            try {
                console.log('Fetching reviews for product:', product._id);
                dispatch(fetchProductReviews(product._id));
                dispatch(checkCanReviewProduct(product._id));
            } catch (error) {
                console.error('Error loading product data:', error);
            }
        }
    }, [dispatch, product?._id, showReviewModal]);

    console.log('Reviews from state:', reviews); // Debug log

    const handleReviewPress = () => {
        setSelectedReview(null); // Reset selected review when adding a new one
        setShowReviewModal(true);
    };

    const handleEditReview = (review) => {
        setSelectedReview(review);
        setShowReviewModal(true);
    };

    // Check if a review belongs to the current user
    const isUserReview = (review) => {
        if (!currentUser) return false;
        return review.user === currentUser._id || review.user === currentUser.id;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Product Images */}
                <View style={styles.imageContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                            const newIndex = Math.round(
                                event.nativeEvent.contentOffset.x / width
                            );
                            setActiveImageIndex(newIndex);
                        }}
                    >
                        {product.images && product.images.length > 0 ? (
                            product.images.map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image.url }}
                                    style={styles.productImage}
                                    defaultSource={require('../../assets/logo.png')}
                                />
                            ))
                        ) : (
                            <View style={styles.imagePlaceholder} />
                        )}
                    </ScrollView>
                    {product.images && product.images.length > 1 && (
                        <View style={styles.pagination}>
                            {product.images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        activeImageIndex === index && styles.paginationDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.brandName}>{product.brand}</Text>

                    {/* Price Section */}
                    <View style={styles.priceSection}>
                        {product.discount > 0 ? (
                            <>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{product.discount}% OFF</Text>
                                </View>
                                <View style={styles.priceDetails}>
                                    <Text style={styles.originalPrice}>₱{product.price.toFixed(2)}</Text>
                                    <Text style={styles.discountedPrice}>
                                    ₱{product.discountedPrice.toFixed(2)}
                                    </Text>
                                    <Text style={styles.savings}>
                                        Save ₱{(product.price - product.discountedPrice).toFixed(2)}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.regularPrice}>₱{product.price.toFixed(2)}</Text>
                        )}
                    </View>

                    {/* Stock Status */}
                    <View style={styles.stockStatusContainer}>
                        {product.stock > 0 ? (
                            <Text style={[
                                styles.stockStatus,
                                product.stock <= 10 && styles.lowStock
                            ]}>
                                {product.stock <= 10 
                                    ? `Only ${product.stock} left in stock!` 
                                    : 'In Stock'}
                            </Text>
                        ) : (
                            <Text style={styles.outOfStock}>Out of Stock</Text>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{product.description}</Text>
                    </View>

                    {/* Category */}
                    <View style={styles.categoryContainer}>
                        <Text style={styles.sectionTitle}>Category</Text>
                        <Text style={styles.category}>{product.category}</Text>
                    </View>

                    {/* Reviews Section */}
                    <View style={styles.reviewsContainer}>
                        <View style={styles.reviewsHeader}>
                            <Text style={styles.sectionTitle}>Reviews</Text>
                            <Text style={styles.ratingText}>
                                Average Rating: {product?.ratings ? `${product.ratings.toFixed(1)} ★` : 'No ratings'}
                            </Text>
                        </View>

                        {/* Reviews List */}
                        {reviewsLoading ? (
                            <Text style={styles.noReviews}>Loading reviews...</Text>
                        ) : reviews && reviews.length > 0 ? (
                            <View style={styles.reviewsList}>
                                {reviews.map((review) => (
                                    <View key={review._id || Math.random()} style={styles.reviewItem}>
                                        <View style={styles.reviewHeader}>
                                        <View style={styles.userInfo}>
                                                {review.userImage ? (
                                                    <Image 
                                                        source={{ uri: review.userImage }} 
                                                        style={styles.userImage} 
                                                    />
                                                ) : (
                                                    <View style={styles.userImagePlaceholder}>
                                                        <Text style={styles.userInitial}>
                                                            {review.name ? review.name[0].toUpperCase() : '?'}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View>
                                                    <Text style={styles.reviewerName}>{review.name}</Text>
                                                    <Text style={styles.reviewDate}>
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.reviewRating}>
                                                {'★'.repeat(review.rating)}
                                                <Text style={styles.emptyStars}>{'☆'.repeat(5 - review.rating)}</Text>
                                            </Text>
                                        </View>
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                        
                                        {/* Edit Review Button - Only show for user's own reviews */}
                                        {isUserReview(review) && (
                                            <TouchableOpacity 
                                                style={styles.editReviewButton}
                                                onPress={() => handleEditReview(review)}
                                            >
                                                <Text style={styles.editReviewText}>Edit Review</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.noReviews}>No reviews yet</Text>
                        )}
                    </View>
                </View>

                {/* Buttons Container */}
                {product.stock > 0 && (
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cartButton]}
                            onPress={() => setShowCartModal(true)}
                        >
                            <Text style={styles.buttonText}>Add to Cart</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.orderButton]}
                            onPress={() => setShowOrderModal(true)}
                        >
                            <Text style={styles.buttonText}>Order Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Add Cart Modal */}
                <CartModal
                    visible={showCartModal}
                    onClose={() => setShowCartModal(false)}
                    product={product}
                />

                {/* Add Order Modal */}
                <OrderModal
                    visible={showOrderModal}
                    onClose={() => setShowOrderModal(false)}
                    product={product}
                    navigation={navigation}
                />

                {/* Add Review Modal with selectedReview prop */}
                <ReviewModal
                    visible={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    productId={product._id}
                    existingReview={selectedReview}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f6ff',
    },
    header: {
        backgroundColor: '#1a56a4',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 40 : 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        width: width,
        height: width * 0.8,
        backgroundColor: 'white',
    },
    productImage: {
        width: width,
        height: width * 0.8,
        resizeMode: 'contain',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ccdeff',
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    paginationDotActive: {
        backgroundColor: '#1a56a4',
    },
    productInfo: {
        padding: 16,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0a2d5a',
        marginBottom: 8,
    },
    brandName: {
        fontSize: 18,
        color: '#666',
        marginBottom: 16,
    },
    priceSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    discountBadge: {
        backgroundColor: '#e74c3c',
        padding: 6,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    discountText: {
        color: 'white',
        fontWeight: 'bold',
    },
    priceDetails: {
        gap: 4,
    },
    originalPrice: {
        fontSize: 16,
        color: '#666',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    regularPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a56a4',
    },
    savings: {
        fontSize: 14,
        color: '#2ecc71',
        fontWeight: '500',
    },
    stockStatusContainer: {
        marginBottom: 16,
    },
    stockStatus: {
        fontSize: 16,
        color: '#2ecc71',
    },
    lowStock: {
        color: '#f39c12',
    },
    outOfStock: {
        fontSize: 16,
        color: '#e74c3c',
    },
    descriptionContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0a2d5a',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    category: {
        fontSize: 16,
        color: '#666',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 16,
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cartButton: {
        backgroundColor: '#1a56a4',
    },
    orderButton: {
        backgroundColor: '#2ecc71',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    addToCartButton: {
        backgroundColor: '#1a56a4',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    addToCartText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reviewsContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingText: {
        fontSize: 16,
        color: '#666',
    },
    reviewsList: {
        maxHeight: 300, // Limit the height of reviews list
    },
    reviewItem: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a56a4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    userInitial: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    reviewDate: {
        fontSize: 12,
        color: '#666',
    },
    reviewRating: {
        fontSize: 16,
        color: '#f39c12',
        fontWeight: 'bold',
    },
    emptyStars: {
        color: '#ddd',
    },
    reviewComment: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    noReviews: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        marginVertical: 16,
    },
    addReviewButton: {
        backgroundColor: '#1a56a4',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 10,
    },
    addReviewText: {
        color: 'white',
        fontWeight: 'bold',
    },
    editReviewButton: {
        backgroundColor: '#f39c12',
        padding: 6,
        borderRadius: 4,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    editReviewText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ProductDetails;
