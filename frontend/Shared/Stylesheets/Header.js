import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ toggleDrawer, navigation }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          onPress={toggleDrawer}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain" 
          />
          <Text style={styles.storeName}>ShoeSpot</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.cartButton}
        onPress={() => navigation?.navigate('Cart')}
      >
        <Ionicons name="cart-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#1a56a4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  storeName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Header;