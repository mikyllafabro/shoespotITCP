import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { listProducts } from '../../Context/Actions/productActions';
import SearchFilters from '../../components/SearchFilters';

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  // Fix the selector to match your store structure
  const productList = useSelector(state => state.productList || {});
  const { loading, products, error } = productList;

  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  const handleSearch = (searchParams) => {
    dispatch(listProducts(searchParams));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain" 
          />
          <Text style={styles.storeName}>ShoeSpot</Text>
        </View>
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminHome')} style={styles.adminButton}>
            <Text style={styles.adminIcon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <Text style={styles.cartIcon}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Add SearchFilters component */}
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
          ) : (
            products?.map((product) => (
              <TouchableOpacity key={product._id} style={styles.productCard}>
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
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#1a56a4',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
  },
  storeName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 22,
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
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0a2d5a',
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
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
});

export default Home;