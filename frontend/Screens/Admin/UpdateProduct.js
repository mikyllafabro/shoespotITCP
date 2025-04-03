import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateProduct } from '../../Context/Actions/productActions';
import baseURL from '../../assets/common/baseUrl';
import { PRODUCT_UPDATE_RESET } from '../../Context/Constants/ProductConstants';

const UpdateProduct = ({ navigation, route }) => {
  const productId = route.params?.productId;
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState([]);
  const [discount, setDiscount] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const validBrands = ['Adidas', 'Nike', 'Converse'];
  const validCategories = ['Running', 'Basketball', 'Casual', 'Training', 'Lifestyle'];

  const dispatch = useDispatch();
  const productUpdate = useSelector(state => state.productUpdate);
  const { loading, success, error } = productUpdate || {};

  // Request permission when component mounts
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        }
      }
    })();
    
    setIsLoading(true);
    fetchProductDetails();
  }, [productId]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      dispatch({ type: PRODUCT_UPDATE_RESET });
    };
  }, []);

  // Monitor success and error from redux
  useEffect(() => {
    if (success) {
      setShowSuccessModal(true);
      setIsSubmitting(false);
      // Reset update status
      dispatch({ type: PRODUCT_UPDATE_RESET });
    }
    if (error) {
      Alert.alert('Error', error);
      setIsSubmitting(false);
    }
  }, [success, error]);

  // Add effect to calculate discounted price
  useEffect(() => {
    if (price && discount) {
      const priceNum = parseFloat(price);
      const discountNum = parseFloat(discount);
      if (!isNaN(priceNum) && !isNaN(discountNum)) {
        const discounted = priceNum * (1 - discountNum/100);
        setDiscountedPrice(discounted.toFixed(2));
      }
    } else {
      setDiscountedPrice(price);
    }
  }, [price, discount]);

  const fetchProductDetails = async () => {
    if (!productId) {
      Alert.alert('Error', 'Product ID is missing');
      navigation.goBack();
      return;
    }

    try {
      console.log('Fetching product with ID:', productId);
      const response = await axios.get(`${baseURL}/products/${productId}`);
      
      console.log('Product data received:', response.data);

      if (!response.data.success) {
        throw new Error('Failed to fetch product details');
      }

      const product = response.data.product;
      
      // Set product data
      setName(product.name || '');
      setBrand(product.brand || '');
      setDescription(product.description || '');
      setPrice(product.price ? product.price.toString() : '');
      setDiscount(product.discount ? product.discount.toString() : '0');
      setCategory(product.category || '');
      setStock(product.stock ? product.stock.toString() : '');
      
      // Set product images
      if (product.images && product.images.length > 0) {
        setImages(product.images.map(img => ({
          url: img.url,
          public_id: img.public_id
        })));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error.response || error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Prepare the image object for our state and API
        const newImage = {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          fileName: selectedImage.fileName || `image-${Date.now()}.jpg`,
          // For UI display
          url: selectedImage.uri
        };

        setImages([...images, newImage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const handleUpdateProduct = async () => {
    if (!name || !price) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImages = [];

      for (const image of images) {
        if (!image.url || image.url.startsWith('file://')) { // Upload new or local images
          const formData = new FormData();
          formData.append('image', {
            uri: image.uri || image.url, // Use uri or url for local images
            type: 'image/jpeg',
            name: image.fileName || `image-${Date.now()}.jpg`,
          });

          console.log("Uploading image to Cloudinary...");

          const uploadResponse = await fetch(`${baseURL}/auth/upload-avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json',
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload product image');
          }

          const uploadResult = await uploadResponse.json();
          uploadedImages.push({
            url: uploadResult.secure_url,
            cloudinary_id: uploadResult.public_id,
          });

          console.log("Image uploaded successfully:", uploadResult.secure_url);
        } else {
          uploadedImages.push(image); // Keep existing Cloudinary images
          console.log("Existing Cloudinary image URL:", image.url);
        }
      }

      const productData = {
        name,
        price: parseFloat(price),
        description,
        category,
        stock: parseInt(stock) || 0,
        brand,
        discount: parseFloat(discount) || 0,
        images: uploadedImages,
      };

      console.log(`Updating product with ID: ${productId}`);

      const result = await dispatch(updateProduct(productId, productData));
      if (result) {
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Brand Selection Modal
  const BrandSelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showBrandModal}
      onRequestClose={() => setShowBrandModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Brand</Text>
          {validBrands.map((brandName) => (
            <TouchableOpacity
              key={brandName}
              style={styles.brandOption}
              onPress={() => {
                setBrand(brandName);
                setShowBrandModal(false);
              }}
            >
              <Text style={[
                styles.brandOptionText,
                brand === brandName && styles.selectedBrandText
              ]}>
                {brandName}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowBrandModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Add Category Selection Modal
  const CategorySelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCategoryModal}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          {validCategories.map((categoryName) => (
            <TouchableOpacity
              key={categoryName}
              style={styles.categoryOption}
              onPress={() => {
                setCategory(categoryName);
                setShowCategoryModal(false);
              }}
            >
              <Text style={[
                styles.categoryOptionText,
                category === categoryName && styles.selectedCategoryText
              ]}>
                {categoryName}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Replace the brand TextInput with this
  const renderBrandSelection = () => (
    <TouchableOpacity
      style={styles.selector}
      onPress={() => setShowBrandModal(true)}
    >
      <Text style={[
        styles.selectorText,
        !brand && styles.placeholderText
      ]}>
        {brand || "Select a brand"}
      </Text>
      <Ionicons name="chevron-down" size={24} color="#666" />
    </TouchableOpacity>
  );

  // Replace the category TextInput with this
  const renderCategorySelection = () => (
    <TouchableOpacity
      style={styles.selector}
      onPress={() => setShowCategoryModal(true)}
    >
      <Text style={[
        styles.selectorText,
        !category && styles.placeholderText
      ]}>
        {category || "Select a category"}
      </Text>
      <Ionicons name="chevron-down" size={24} color="#666" />
    </TouchableOpacity>
  );

  const handleSuccessModalClose = (shouldNavigate = false) => {
    setShowSuccessModal(false);
    if (shouldNavigate) {
      navigation.goBack();
    }
  };

  // Add success modal component
  const SuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccessModal}
      onRequestClose={() => handleSuccessModalClose(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContent, { width: '90%', maxWidth: 340 }]}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
          </View>
          <Text style={[styles.modalTitle, { fontSize: 28 }]}>Success!</Text>
          <Text style={[styles.modalText, { marginVertical: 15 }]}>
            Product has been updated successfully.
          </Text>
          <View style={[styles.modalButtons, { marginTop: 20 }]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.viewProductsButton]}
              onPress={() => handleSuccessModalClose(true)}
            >
              <Text style={styles.modalButtonText}>Back to Products</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createAnotherButton]}
              onPress={() => handleSuccessModalClose(false)}
            >
              <Text style={styles.modalButtonText}>Continue Editing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1a56a4" />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Update Product</Text>
      </View>
      
      <ScrollView style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter product name"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand</Text>
          {renderBrandSelection()}
          <BrandSelectionModal />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter product description"
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price ($) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Discount (%)</Text>
            <TextInput
              style={styles.input}
              value={discount}
              onChangeText={setDiscount}
              placeholder="0"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        {/* Add discounted price display */}
        {parseFloat(discount) > 0 && (
          <View style={styles.discountInfoContainer}>
            <Text style={styles.discountLabel}>Discounted Price:</Text>
            <Text style={styles.discountedPrice}>
              ${discountedPrice}
            </Text>
            <Text style={styles.savingsText}>
              Save ${(parseFloat(price) - parseFloat(discountedPrice)).toFixed(2)}
            </Text>
          </View>
        )}
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price ($) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          {renderCategorySelection()}
          <CategorySelectionModal />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Images</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image 
                  source={{ uri: image.url || image.uri }} 
                  style={styles.imagePreview} 
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.addImageButton} 
              onPress={pickImage}
            >
              <Ionicons name="add" size={24} color="#1a56a4" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={handleUpdateProduct}
          disabled={isSubmitting || loading}
        >
          {(isSubmitting || loading) ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.updateButtonText}>Update Product</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <SuccessModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f6ff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#0a2d5a',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#ccdeff',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    margin: 4,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  updateButton: {
    backgroundColor: '#1a56a4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1a56a4',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  brandOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  brandOptionText: {
    fontSize: 16,
    color: '#333',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedBrandText: {
    color: '#1a56a4',
    fontWeight: 'bold',
  },
  selectedCategoryText: {
    color: '#1a56a4',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#666',
    fontSize: 16,
  },
  discountInfoContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  discountLabel: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 14,
    color: '#388e3c',
  },
  successIconContainer: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 50,
    padding: 15,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  viewProductsButton: {
    backgroundColor: '#1a56a4',
  },
  createAnotherButton: {
    backgroundColor: '#2ecc71',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UpdateProduct;