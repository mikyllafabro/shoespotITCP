import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct } from '../../Context/Actions/productActions'; // Import the action
import axios from 'axios'; // Import axios
import baseURL from '../../assets/common/baseUrl'; // Import baseURL

const CreateProduct = ({ navigation }) => {
  const dispatch = useDispatch();
  const productCreate = useSelector(state => state.productCreate);
  const { loading, success, error } = productCreate || {};

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');

  const validBrands = ['Adidas', 'Nike', 'Converse'];
  const validCategories = ['Running', 'Basketball', 'Casual', 'Training', 'Lifestyle'];

  // Request permission when component mounts
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
      }
    })();
  }, []);

  // Add reset form function
  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setCategory('');
    setStock('');
    setBrand('');
    setImages([]);
    setIsLoading(false);
    setDiscount('');
    setDiscountedPrice('');
  };

  // Update success handling
  useEffect(() => {
    if (success) {
      Alert.alert(
        'Success',
        'Product created successfully',
        [
          {
            text: 'View Products',
            onPress: () => {
              resetForm();
              dispatch({ type: 'PRODUCT_CREATE_RESET' });
              navigation.replace('ViewProducts'); // Use replace instead of goBack
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              resetForm();
              dispatch({ type: 'PRODUCT_CREATE_RESET' });
            },
          }
        ]
      );
    }
    if (error) {
      Alert.alert('Error', error);
      setIsLoading(false);
    }
  }, [success, error, navigation]);

  // Update the test connection function
  const testConnection = async () => {
    try {
        console.log('Testing API connection...');
        const response = await axios.get(`${baseURL}/products`, {
            timeout: 5000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Connection test response:', {
            status: response.status,
            baseURL: baseURL,
            platform: Platform.OS
        });
        
    } catch (error) {
        console.error('Connection test error details:', {
            message: error.message,
            baseURL: baseURL,
            platform: Platform.OS,
            isAxiosError: error.isAxiosError
        });
        
        Alert.alert(
            'Connection Error',
            'Please check:\n\n' +
            '1. Backend server is running\n' +
            '2. Correct IP address is configured\n' +
            '3. Network connectivity is available\n\n' +
            `Error: ${error.message}`,
            [{ text: 'OK' }]
        );
    }
};

  useEffect(() => {
    testConnection();
  }, []);

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
            
            // Format image data properly
            const newImage = {
                uri: selectedImage.uri,
                type: 'image/jpeg',
                name: `image-${Date.now()}.jpg`
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

  // Add this function to calculate discounted price
  useEffect(() => {
    if (price && discount) {
      const priceNum = parseFloat(price);
      const discountNum = parseFloat(discount);
      if (!isNaN(priceNum) && !isNaN(discountNum)) {
        const discounted = priceNum * (1 - discountNum/100);
        setDiscountedPrice(discounted.toFixed(2));
      }
    } else {
      setDiscountedPrice('');
    }
  }, [price, discount]);

  const handleSubmit = async () => {
    if (!name || !price || !description || !category || !stock || !brand) {
        Alert.alert('Validation Error', 'Please fill all required fields');
        return;
    }

    setIsLoading(true);

    try {
        const formattedData = {
            name,
            price: parseFloat(price),
            description,
            category,
            stock: parseInt(stock),
            brand,
            status: 'Available',
            discount: parseFloat(discount) || 0, // Ensure discount is passed
            images: images.map(img => ({
                uri: img.uri,
                type: 'image/jpeg',
                name: img.name || `image-${Date.now()}.jpg`
            }))
        };

        console.log('Submitting product data:', formattedData);
        await dispatch(createProduct(formattedData));
        
    } catch (error) {
        console.error('Error creating product:', error);
        Alert.alert(
            'Error',
            error.response?.data?.message || 'Failed to create product'
        );
    } finally {
        setIsLoading(false);
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

  // Replace the Picker with a TouchableOpacity
  const renderBrandSelection = () => (
    <TouchableOpacity
      style={styles.brandSelector}
      onPress={() => setShowBrandModal(true)}
    >
      <Text style={[
        styles.brandSelectorText,
        !brand && styles.brandPlaceholder
      ]}>
        {brand || "Select a brand"}
      </Text>
      <Ionicons name="chevron-down" size={24} color="#666" />
    </TouchableOpacity>
  );

  // Add Category Selection Renderer
  const renderCategorySelection = () => (
    <TouchableOpacity
      style={styles.categorySelector}
      onPress={() => setShowCategoryModal(true)}
    >
      <Text style={[
        styles.categorySelectorText,
        !category && styles.categoryPlaceholder
      ]}>
        {category || "Select a category"}
      </Text>
      <Ionicons name="chevron-down" size={24} color="#666" />
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Create New Product</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.formLabel}>Product Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
        />
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.formLabel}>Price ($) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.formLabel}>Discount (%)</Text>
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

        {discount > 0 && (
          <View style={styles.discountInfoContainer}>
            <Text style={styles.discountLabel}>Discounted Price:</Text>
            <Text style={styles.discountedPrice}>
              ${discountedPrice || '0.00'}
            </Text>
            <Text style={styles.savingsText}>
              Save ${((price - (discountedPrice || price)) || 0).toFixed(2)}
            </Text>
          </View>
        )}
        
        <Text style={styles.formLabel}>Brand</Text>
        {renderBrandSelection()}
        <BrandSelectionModal />
        
        <Text style={styles.formLabel}>Category</Text>
        {renderCategorySelection()}
        <CategorySelectionModal />
        
        <Text style={styles.formLabel}>Stock</Text>
        <TextInput
          style={styles.input}
          value={stock}
          onChangeText={setStock}
          placeholder="Enter stock quantity"
          keyboardType="numeric"
        />
        
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter product description"
          multiline={true}
          numberOfLines={4}
        />
        
        {/* Image Section */}
        <Text style={styles.formLabel}>Product Images</Text>
        <View style={styles.imageSection}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: img.uri }} style={styles.imagePreview} />
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
            <Ionicons name="add" size={30} color="#1a56a4" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading || loading}
        >
          {(isLoading || loading) ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Create Product</Text>
          )}
        </TouchableOpacity>
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
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a2d5a',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  // Add these new styles for image handling
  imageSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageContainer: {
    width: 100,
    height: 100,
    margin: 5,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  submitButton: {
    backgroundColor: '#1a56a4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    overflow: 'hidden', // This helps on some Android devices
  },
  picker: {
    height: 50,
    width: '100%',
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
  brandOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  brandOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedBrandText: {
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
  brandSelector: {
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
  brandSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  brandPlaceholder: {
    color: '#999',
  },
  categorySelector: {
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
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
  },
  categoryPlaceholder: {
    color: '#999',
  },
  categoryOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#1a56a4',
    fontWeight: 'bold',
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
});
export default CreateProduct;

