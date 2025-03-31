// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   Platform,
//   TouchableOpacity,
//   StyleSheet,
//   Modal,
//   SafeAreaView,
//   Dimensions
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import Home from '../Screens/Home/Home';
// import Sidebar from './Stylesheets/Sidebar';

// const { width } = Dimensions.get('window');

// // Simple SidebarContainer implementation without Reanimated
// const SidebarContainer = ({ navigation }) => {
//   const [showSidebar, setShowSidebar] = useState(false);

//   const toggleSidebar = () => {
//     setShowSidebar(!showSidebar);
//   };

//   const closeSidebar = () => {
//     setShowSidebar(false);
//   };

//   return (
//     <View style={styles.container}>
//       {/* Home Component - we pass the toggleDrawer function */}
//       <Home toggleDrawer={toggleSidebar} navigation={navigation} />
      
//       {/* Modal for sidebar */}
//       <Modal
//         visible={showSidebar}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={closeSidebar}
//       >
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalInner}>
//             {/* Overlay to close sidebar when tapped */}
//             <TouchableOpacity 
//               style={styles.sidebarOverlay}
//               activeOpacity={1}
//               onPress={closeSidebar}
//             />
            
//             {/* Sidebar content */}
//             <View style={styles.sidebarContainer}>
//               <Sidebar closeSidebar={closeSidebar} navigation={navigation} />
//             </View>
//           </View>
//         </SafeAreaView>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#1a56a4',
//     height: 60,
//     paddingHorizontal: 15,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//   },
//   logoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginLeft: 10,
//   },
//   modalContainer: {
//     flex: 1,
//     flexDirection: 'row',
//   },
//   sidebarOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   sidebarContainer: {
//     width: '70%',
//     backgroundColor: '#ffffff',
//     shadowColor: '#000',
//     shadowOffset: { width: 2, height: 0 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   cartButton: {
//     padding: 8,
//   },
// });

// export default SidebarContainer;

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
