// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import Home from './Screens/Home';
// import WelcomeScreen from './Screens/index';
// import About from './Screens/About';
// import Login from '../client/auth/Login';
// import SignUp from '../client/auth/SignUp';

// //routes
// const Stack = createNativeStackNavigator();

// export default function App() {
//   return (

//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="welcome">
//       <Stack.Screen 
//           name="welcome" 
//           component={WelcomeScreen} 
//           options={{
//             headerShown: false,
//         }}/>
//         <Stack.Screen 
//           name="login" 
//           component={Login} 
//           options={{
//             title: "Login",
//             headerShown: false,
//             headerStyle: {
//               backgroundColor: '#1a56a4',
//             },
//             headerTintColor: '#fff',
//         }}/>
//         <Stack.Screen 
//           name="signup" 
//           component={SignUp} 
//           options={{
//             title: "Create Account",
//             headerShown: false,
//             headerStyle: {
//               backgroundColor: '#1a56a4',
//             },
//             headerTintColor: '#fff',
//         }}/>
//         <Stack.Screen 
//           name="home" 
//           component={Home} 
//           options={{
//             headerShown: false,
//         }}/>
//         <Stack.Screen name="about" component={About} />
        
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import React from "react";
import { Provider } from "react-redux";
// Change to use the Context store instead of Redux store
import store from "./Context/Store/store";
import AppNavigator from "./Navigators/AppNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}