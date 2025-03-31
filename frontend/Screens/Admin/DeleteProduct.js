import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator,
  Alert,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const DeleteProduct = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deletedProductName, setDeletedProductName] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await axios.get('https://your-api-endpoint/api/products');
      setProducts(response.data.products);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to fetch products');
    }
  };

  const confirmDelete = (product) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteProduct(product._id), style: 'destructive' }
      ]
    );
  };

  const deleteProduct = async (productId) => {
    setIsDeleting(true);
    try {
      // Get product name before deletion
      const productToDelete = products.find(p => p._id === productId);
      if (!productToDelete) throw new Error('Product not found');

      await axios.delete(`https://your-api-endpoint/api/products/${productId}`);
      
      // After successful deletion
      setProducts(prev => prev.filter(p => p._id !== productId));
      setDeletedProductName(productToDelete.name);
      setShowSuccessModal(true); // Show modal immediately after successful deletion
    } catch (err) {
      Alert.alert('Error', 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add a handler for modal close
  const handleModalClose = () => {
    setShowSuccessModal(false);
    setDeletedProductName('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.images && item.images[0] ? (
          <Image 
            source={{ uri: item.images[0].url }} 
            style={styles.productImage}
            defaultSource={require('../../assets/logo.png')}
          />
        ) : (
          <View style={styles.productImagePlaceholder} />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productStock}>Stock: {item.stock}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => confirmDelete(item)}
        disabled={isDeleting}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Update the Success Modal Component
  const SuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccessModal}
      onRequestClose={handleModalClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContent, { width: '90%', maxWidth: 340 }]}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
          </View>
          <Text style={styles.modalTitle}>Deleted Successfully!</Text>
          <Text style={styles.modalText}>
            "{deletedProductName}" has been removed from your inventory.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={handleModalClose}
          >
            <Text style={styles.modalButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('AdminProducts')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Products</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchProducts}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
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
          keyExtractor={item => item._id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          )}
        />
      )}

      {isDeleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Deleting...</Text>
        </View>
      )}

      <SuccessModal />
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
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ccdeff',
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
    marginTop: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 50,
    padding: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalButton: {
    backgroundColor: '#1a56a4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeleteProduct;