import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from 'react-redux';
import Home from "../Screens/Home/Home";
import Login from "../auth/Login";
import SignUp from "../auth/SignUp";
import WelcomeScreen from "../Screens/WelcomeScreen";
import { useAuth } from "../Context/Actions/AuthContext";
import SidebarContainer from "../Shared/SidebarContainer";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoading } = useAuth();
  const auth = useSelector(state => state.auth) || { isAuthenticated: false };
  const { isAuthenticated } = auth;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a56a4" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WelcomeScreen">
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Public screens
          <>
            <Stack.Screen 
              name="SidebarContainer" 
              component={SidebarContainer} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUp} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="WelcomeScreen" 
              component={WelcomeScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;