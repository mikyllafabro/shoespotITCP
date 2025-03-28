import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Platform,
  DrawerLayoutAndroid,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  BackHandler,
  SafeAreaView
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../Screens/Home/Home';
import Sidebar from '../Shared/Stylesheets/Sidebar';

const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');

const SidebarContainer = () => {
  const drawer = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-width * 0.7)).current;

  // Handle back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (drawer.current && drawer.current._nativeTag) {
          try {
            drawer.current.closeDrawer();
            return true;
          } catch (error) {
            console.error('Error closing drawer:', error);
          }
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, []);

  const openDrawer = () => {
    if (Platform.OS === 'android') {
      drawer.current?.openDrawer();
    } else {
      toggleSidebar();
    }
  };

  const closeDrawer = () => {
    if (Platform.OS === 'android') {
      drawer.current?.closeDrawer();
    } else {
      toggleSidebar();
    }
  };

  const toggleSidebar = () => {
    if (showSidebar) {
      Animated.timing(sidebarAnimation, {
        toValue: -width * 0.7,
        duration: 300,
        useNativeDriver: true
      }).start(() => setShowSidebar(false));
    } else {
      setShowSidebar(true);
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  // Content for the main app (not in the sidebar)
  const mainContent = () => (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        options={{ headerShown: false }}
      >
        {(props) => <Home {...props} toggleDrawer={openDrawer} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  // iOS implementation
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        {mainContent()}
        
        {showSidebar && (
          <TouchableOpacity 
            style={styles.sidebarOverlay}
            activeOpacity={1}
            onPress={toggleSidebar}
          >
            <Animated.View 
              style={[
                styles.sidebarContainer,
                { transform: [{ translateX: sidebarAnimation }] }
              ]}
            >
              <Sidebar closeSidebar={toggleSidebar} />
            </Animated.View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // Android implementation
  return (
    <DrawerLayoutAndroid
      ref={drawer}
      drawerWidth={width * 0.7}
      drawerPosition="left"
      renderNavigationView={() => <Sidebar closeSidebar={closeDrawer} />}
    >
      {mainContent()}
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: '#ffffff',
    zIndex: 1001,
  },
});

export default SidebarContainer;