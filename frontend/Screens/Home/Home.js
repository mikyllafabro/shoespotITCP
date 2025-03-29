import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  PanResponder
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { listProducts } from '../../Context/Actions/productActions';
import SearchFilters from '../../components/SearchFilters';
import Header from '../../Shared/Stylesheets/Header';
import WelcomeBanner from '../../Shared/Stylesheets/WelcomeBanner';
import Sidebar from '../../Shared/Stylesheets/Sidebar';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.7;

const Home = ({ toggleDrawer }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Redux state for products
  const productList = useSelector(state => state.productList || {});
  const { loading, products, error } = productList;
  
  // Sidebar animation
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [isOpen, setIsOpen] = useState(false);
  
  // Background opacity animation
  const backdropOpacity = translateX.interpolate({
    inputRange: [-SIDEBAR_WIDTH, 0],
    outputRange: [0, 0.7],
    extrapolate: 'clamp'
  });

  // Setup pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal movements
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow movement when sidebar is open or when swiping from left edge
        if (isOpen || gestureState.moveX < 20) {
          // Calculate new position, bounded between -SIDEBAR_WIDTH and 0
          let newPosition = isOpen ? gestureState.dx : gestureState.dx - SIDEBAR_WIDTH;
          newPosition = Math.max(-SIDEBAR_WIDTH, Math.min(0, newPosition));
          translateX.setValue(newPosition);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Determine whether to open or close based on velocity and position
        if (
          (isOpen && gestureState.dx < -50) || // Swiping left to close
          (!isOpen && gestureState.dx < 50)     // Not enough swipe right to open
        ) {
          closeDrawer();
        } else if (
          (!isOpen && gestureState.dx > 50) || // Swiping right to open
          (isOpen && gestureState.dx > -50)     // Not enough swipe left to close
        ) {
          openDrawer();
        } else {
          // Return to previous state
          Animated.spring(translateX, {
            toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      }
    })
  ).current;

  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  const handleSearch = (searchParams) => {
    dispatch(listProducts(searchParams));
  };

  // Open drawer with animation
  const openDrawer = () => {
    setIsOpen(true);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  // Close drawer with animation
  const closeDrawer = () => {
    Animated.spring(translateX, {
      toValue: -SIDEBAR_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start(() => {
      setIsOpen(false);
    });
  };

  // Handle drawer toggle from header
  const handleToggleDrawer = () => {
    if (toggleDrawer) {
      toggleDrawer();
    } else if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      {/* Separated Header Component */}
      <Header toggleDrawer={handleToggleDrawer} navigation={navigation} />
      
      {/* Animated Backdrop */}
      {!toggleDrawer && (
        <Animated.View 
          style={[
            sidebarStyles.backdrop,
            { 
              opacity: backdropOpacity,
              pointerEvents: isOpen ? 'auto' : 'none'
            }
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1}
            onPress={closeDrawer}
          />
        </Animated.View>
      )}
      
      {/* Animated Sidebar */}
      {!toggleDrawer && (
        <Animated.View 
          style={[
            sidebarStyles.sidebar,
            { transform: [{ translateX }] }
          ]}
        >
          <Sidebar closeSidebar={closeDrawer} navigation={navigation} />
        </Animated.View>
      )}
      
      {/* Separated Welcome Banner Component */}
      <WelcomeBanner />
      
      {/* Main content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Filters */}
        <SearchFilters onSearch={handleSearch} />
        
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroText}>Step Into Style</Text>
          <Text style={styles.heroSubtext}>Discover the season's hottest footwear</Text>
          <TouchableOpacity style={styles.shopButton}>
            <Text style={styles.shopButtonText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {['Running', 'Casual', 'Formal', 'Sports', 'Kids'].map((category) => (
            <TouchableOpacity key={category} style={styles.categoryCard}>
              <View style={styles.categoryCircle}>
                <Text style={styles.categoryIcon}>👞</Text>
              </View>
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Products */}
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <View style={styles.productsGrid}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#1a56a4" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : products && products.length > 0 ? (
            products.map((product) => (
              <TouchableOpacity 
                key={product._id} 
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetails', { product })}
              >
                <View style={styles.productImageContainer}>
                  {product.images && product.images[0] ? (
                    <Image 
                      source={{ uri: product.images[0].url }} 
                      style={styles.productImage}
                      defaultSource={require('../../assets/logo.png')}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder} />
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name || 'No name available'}
                </Text>
                <Text style={styles.brand}>
                  {product.brand || 'Brand not specified'}
                </Text>

                {/* Price and Discount Section */}
                <View style={styles.priceContainer}>
                  {product.discount > 0 ? (
                    <>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{product.discount}%</Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.originalPrice}>
                          ${product.price?.toFixed(2)}
                        </Text>
                        <Text style={styles.discountedPrice}>
                          ${product.discountedPrice?.toFixed(2)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.regularPrice}>
                      ${product.price?.toFixed(2)}
                    </Text>
                  )}
                </View>

                {/* Stock Status */}
                <View style={styles.stockContainer}>
                  {product.stock > 0 ? (
                    <Text style={[
                      styles.stockText,
                      product.stock <= 10 && styles.lowStockText
                    ]}>
                      {product.stock <= 10 ? `Only ${product.stock} left` : 'In Stock'}
                    </Text>
                  ) : (
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  )}
                </View>

                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>
                    ★ {(product.ratings || 0).toFixed(1)}
                  </Text>
                  <Text style={styles.reviews}>
                    ({product.numOfReviews || 0})
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noProductsText}>No products found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
  },
  scrollView: {
    flex: 1,
  },
  heroBanner: {
    height: 180,
    backgroundColor: '#3678de',
    borderRadius: 10,
    margin: 16,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  heroSubtext: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
    opacity: 0.9,
  },
  shopButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginTop: 15,
  },
  shopButtonText: {
    color: '#1a56a4',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    color: '#0a2d5a',
  },
  categoriesContainer: {
    paddingLeft: 16,
    marginBottom: 10,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#d9e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
    color: '#0a2d5a',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '48%',
    marginBottom: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#ccdeff',
    borderRadius: 8,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0a2d5a',
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a56a4',
    marginTop: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
    width: '100%',
  },
  noProductsText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
    width: '100%',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: '#f39c12',
    fontSize: 12,
    marginRight: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    marginVertical: 4,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  regularPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  stockContainer: {
    marginTop: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#2ecc71',
  },
  lowStockText: {
    color: '#f39c12',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#e74c3c',
  },

  priceContainer: {
    marginVertical: 4,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  regularPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  stockContainer: {
    marginTop: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#2ecc71',
  },
  lowStockText: {
    color: '#f39c12',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#e74c3c',
  },
});

// Styles for the sliding sidebar
const sidebarStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#ffffff',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
});

export default Home;