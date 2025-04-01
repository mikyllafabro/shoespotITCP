import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo vector icons

const AdminHome = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a56a4" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.welcomeText}>Welcome to the Admin Panel</Text>
        
        {/* Admin Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('AdminProducts')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#3498db' }]}>
              <Text style={styles.icon}>📦</Text>
            </View>
            <Text style={styles.cardTitle}>Products</Text>
            <Text style={styles.cardSubtitle}>Manage inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('AdminOrders')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#2ecc71' }]}>
              <Text style={styles.icon}>🛒</Text>
            </View>
            <Text style={styles.cardTitle}>Orders</Text>
            <Text style={styles.cardSubtitle}>Track orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#e74c3c' }]}>
              <Text style={styles.icon}>👥</Text>
            </View>
            <Text style={styles.cardTitle}>Users</Text>
            <Text style={styles.cardSubtitle}>Manage accounts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('AdminAnalytics')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#f39c12' }]}>
              <Text style={styles.icon}>📊</Text>
            </View>
            <Text style={styles.cardTitle}>Analytics</Text>
            <Text style={styles.cardSubtitle}>View statistics</Text>
          </TouchableOpacity>
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
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0a2d5a',
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a2d5a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a2d5a',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    color: '#333',
  },
  activityTime: {
    color: '#999',
    fontSize: 12,
  },
});

export default AdminHome;