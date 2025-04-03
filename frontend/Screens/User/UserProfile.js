import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import baseUrl from '../../assets/common/baseUrl';
import * as SecureStore from 'expo-secure-store';

const UserProfile = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    image: null
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('jwt');
      const response = await axios.get(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profile = response.data.user;
      setUserData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.mobileNumber || '',
        address: profile.address || '',
        image: profile.userImage || null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!isEditing) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUserData(prev => ({ ...prev, image: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('jwt');
      
      // Handle image upload if there's a new local image
      if (userData.image && !userData.image.startsWith('https://')) {
        const formData = new FormData();
        formData.append('image', {  // Changed from 'avatar' to 'image'
          uri: userData.image,
          type: 'image/jpeg',
          name: 'profile-image.jpg'
        });

        // Upload image first
        const imageResponse = await axios.post(
          `${baseUrl}/auth/upload-avatar`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (imageResponse.data.success) {
          userData.image = imageResponse.data.imageUrl;
        }
      }

      // Update other profile information
      const updateData = {
        name: userData.name,
        mobileNumber: userData.phone,
        address: userData.address,
        image: userData.image
      };

      const response = await axios.put(
        `${baseUrl}/auth/profile`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
        await fetchUserProfile();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Image */}
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={handlePickImage}
        >
          {userData.image ? (
            <Image 
              source={{ uri: userData.image }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>
                {userData.name ? userData.name[0].toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          {isEditing && (
            <View style={styles.editImageOverlay}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoField}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userData.name}
              onChangeText={text => setUserData(prev => ({ ...prev, name: text }))}
              editable={isEditing}
            />
          </View>

          <View style={styles.infoField}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={userData.email}
              editable={false}
            />
          </View>

          <View style={styles.infoField}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userData.phone}
              onChangeText={text => setUserData(prev => ({ ...prev, phone: text }))}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.infoField}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput, styles.addressInput]}
              value={userData.address}
              onChangeText={text => setUserData(prev => ({ ...prev, address: text }))}
              editable={isEditing}
              multiline
              numberOfLines={3}
            />
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f6ff',
  },
  header: {
    backgroundColor: '#1a56a4',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a56a4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a56a4',
    padding: 8,
    borderRadius: 20,
  },
  infoSection: {
    padding: 16,
  },
  infoField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default UserProfile;