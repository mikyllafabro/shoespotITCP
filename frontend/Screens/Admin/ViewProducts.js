import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { listProducts, deleteProduct } from '../../Context/Actions/productActions';
import baseURL from '../../assets/common/baseUrl';
import axios from 'axios';
import { PRODUCT_UPDATE_RESET, PRODUCT_DELETE_RESET } from '../../Context/Constants/ProductConstants';

const ViewProducts = ({ navigation }) => {
    const dispatch = useDispatch();
    const productList = useSelector(state => state.productList || { loading: false, error: null, products: [] });
    const { loading, error, products } = productList;

    const productDelete = useSelector(state => state.productDelete || { loading: false, success: false, error: null });
    const { loading: deleteLoading, success: deleteSuccess, error: deleteError } = productDelete;

    const handleEditProduct = (productId) => {
        // Reset any previous update state before navigation
        dispatch({ type: PRODUCT_UPDATE_RESET });
        navigation.navigate('UpdateProduct', { productId: productId });
    };

    const handleDeleteProduct = (productId) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteProduct(productId));
                        } catch (error) {
                            console.error('Error deleting product:', error);
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchProducts();
        // Cleanup function
        return () => {
            dispatch({ type: PRODUCT_DELETE_RESET });
        };
    }, [dispatch]);

    const fetchProducts = async () => {
        try {
            await dispatch(listProducts());
        } catch (error) {
            console.error('Error in fetchProducts:', error);
            Alert.alert('Error', 'Failed to fetch products. Please try again.');
        }
    };

    useEffect(() => {
        if (deleteSuccess) {
            Alert.alert('Success', 'Product deleted successfully');
            dispatch({ type: PRODUCT_DELETE_RESET });
            fetchProducts();
        } else if (deleteError) {
            Alert.alert('Error', deleteError);
            dispatch({ type: PRODUCT_DELETE_RESET });
        }
    }, [deleteSuccess, deleteError]);

  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <TouchableOpacity 
        style={styles.productImageContainer}
        onPress={() => handleEditProduct(item._id)}
      >
        {item.images && item.images[0] ? (
          <Image 
            source={{ uri: item.images[0].url }} 
            style={styles.productImage}
            defaultSource={require('../../assets/logo.png')}
          />
        ) : (
          <View style={styles.productImagePlaceholder} />
        )}
      </TouchableOpacity>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        
        {/* Updated price display */}
        <View style={styles.priceSection}>
          {item.discount > 0 ? (
            <>
              <View style={styles.priceHeader}>
                <Text style={styles.discountBadge}>-{item.discount}% OFF</Text>
              </View>
              <View style={styles.priceDetails}>
                <View style={styles.originalPriceRow}>
                  <Text style={styles.priceLabel}>Original:</Text>
                  <Text style={styles.originalPrice}>₱{item.price?.toFixed(2)}</Text>
                </View>
                <View style={styles.discountedPriceRow}>
                  <Text style={styles.priceLabel}>After Discount:</Text>
                  <Text style={styles.discountedPrice}>₱{item.discountedPrice?.toFixed(2)}</Text>
                </View>
                <Text style={styles.savings}>
                  Save ₱{(item.price - (item.discountedPrice || item.price)).toFixed(2)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.regularPrice}>
              ₱{item.price?.toFixed(2)}
            </Text>
          )}
        </View>

        <View style={styles.productMeta}>
          <Text style={styles.productStock}>Stock: {item.stock || 0}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditProduct(item._id)}
            >
              <Ionicons name="pencil" size={18} color="#1a56a4" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteProduct(item._id)}
            >
              <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('AdminHome')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Products</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchProducts}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a56a4" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={item => item._id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No products found</Text>
          )}
        />
      )}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateProduct')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
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
    paddingTop: 25,
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
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ccdeff',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a2d5a',
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a56a4',
    marginTop: 4,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 5,
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a56a4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  priceContainer: {
    marginVertical: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  priceSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceDetails: {
    marginTop: 4,
  },
  originalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountedPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  regularPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a56a4',
  },
  savings: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ViewProducts;