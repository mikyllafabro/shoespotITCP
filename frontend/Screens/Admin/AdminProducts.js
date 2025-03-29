import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import baseURL from '../../assets/common/baseUrl';

const AdminProducts = ({ navigation }) => {
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryStats();
  }, []);

  const fetchInventoryStats = async () => {
    try {
      const response = await axios.get(`${baseURL}/inventory-stats`);
      if (response.data.success) {
        setInventoryStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Product Management</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.welcomeText}>Manage Your Products</Text>
        
        {/* CRUD Options */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#3498db' }]} 
            onPress={() => navigation.navigate('ViewProducts')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={32} color="white" />
            </View>
            <Text style={styles.actionTitle}>View Products</Text>
            <Text style={styles.actionDescription}>Browse and search your product inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#2ecc71' }]} 
            onPress={() => navigation.navigate('CreateProduct')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={32} color="white" />
            </View>
            <Text style={styles.actionTitle}>Add Product</Text>
            <Text style={styles.actionDescription}>Create a new product listing</Text>
          </TouchableOpacity>
          

        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Inventory Stats</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : inventoryStats.totalProducts}
              </Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : inventoryStats.lowStockProducts}
              </Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : inventoryStats.outOfStockProducts}
              </Text>
              <Text style={styles.statLabel}>Out of Stock</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.refreshStats}
            onPress={fetchInventoryStats}
          >
            <Ionicons name="refresh" size={20} color="#1a56a4" />
            <Text style={styles.refreshText}>Refresh Stats</Text>
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
  actionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a2d5a',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a56a4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  refreshStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
  },
  refreshText: {
    color: '#1a56a4',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default AdminProducts;