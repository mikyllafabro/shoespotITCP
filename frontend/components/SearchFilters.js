import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

const SearchFilters = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  const categories = ['Adidas', 'Nike', 'Converse'];

  const adjustPrice = (type, amount) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(prev[type] + amount, 10000))
    }));
  };

  const handleSearch = () => {
    // Only include non-empty values in filters
    const filters = {};

    if (searchQuery.trim()) {
      filters.keyword = searchQuery.trim();
    }

    if (selectedCategory) {
      filters.brand = selectedCategory; // Changed from category to brand
    }

    if (priceRange.min > 0 || priceRange.max < 1000) {
      filters.price = {
        min: priceRange.min,
        max: priceRange.max
      };
    }

    console.log('Applying filters:', filters); // Debug log
    onSearch(filters);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 1000 });
    onSearch({}); // Reset to default search with empty filters
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search shoes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch} // Add this to allow search on enter
        returnKeyType="search"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category === selectedCategory ? '' : category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.selectedCategoryText
            ]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.priceRangeContainer}>
        <Text style={styles.priceRangeLabel}>
          Price Range: ${priceRange.min.toFixed(0)} - ${priceRange.max.toFixed(0)}
        </Text>
        <View style={styles.priceControls}>
          <View style={styles.priceControl}>
            <Text>Min Price:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustPrice('min', -100)}>
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={styles.priceValue}>${priceRange.min}</Text>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustPrice('min', 100)}>
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.priceControl}>
            <Text>Max Price:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustPrice('max', -100)}>
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={styles.priceValue}>${priceRange.max}</Text>
              <TouchableOpacity style={styles.adjustButton} onPress={() => adjustPrice('max', 100)}>
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Apply Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    backgroundColor: '#f0f6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f6ff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d9e6ff',
  },
  selectedCategoryChip: {
    backgroundColor: '#1a56a4',
  },
  categoryText: {
    color: '#1a56a4',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: 'white',
  },
  priceRangeContainer: {
    marginBottom: 16,
  },
  priceRangeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceControls: {
    marginTop: 10,
  },
  priceControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustButton: {
    backgroundColor: '#1a56a4',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  priceValue: {
    marginHorizontal: 10,
    minWidth: 60,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#1a56a4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#1a56a4',
  },
  clearButtonText: {
    color: '#1a56a4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchFilters;
