import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar } from 'react-native'
import React from 'react'

const Home = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain" 
          />
          <Text style={styles.storeName}>ShoeSpot</Text>
        </View>
        <TouchableOpacity>
          <View style={styles.cartButton}>
            <Text style={styles.cartIcon}>🛒</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Main content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          {[1, 2, 3, 4].map((item) => (
            <TouchableOpacity key={item} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <View style={styles.productImagePlaceholder} />
              </View>
              <Text style={styles.productName}>Classic Blue Sneaker</Text>
              <Text style={styles.productPrice}>$129.99</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default Home;

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
});