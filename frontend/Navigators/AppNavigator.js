import 'react-native-gesture-handler';
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
// import SidebarContainer from "../Shared/SidebarContainer";
import Home from "../Screens/Home/Home";
import Login from "../auth/Login";
import SignUp from "../auth/SignUp";
import Welcome from "../Screens/WelcomeScreen";
import Sidebar from "../Shared/Stylesheets/Sidebar";
import AdminHome from "../Screens/Admin/AdminHome";
import AdminProducts from "../Screens/Admin/AdminProducts";
import CreateProduct from "../Screens/Admin/CreateProduct";
import ViewProducts from "../Screens/Admin/ViewProducts";
import UpdateProduct from "../Screens/Admin/UpdateProduct";
import DeleteProduct from "../Screens/Admin/DeleteProduct";

const Stack = createNativeStackNavigator();

const selectAuth = state => state.auth ? {
  isAuthenticated: state.auth.isAuthenticated,
} : { isAuthenticated: false };

const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth || { isAuthenticated: false });
  
  console.log("AppNavigator - isAuthenticated:", isAuthenticated);

    return (
      <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          // Auth screens
          <>
            <Stack.Screen 
              name="Welcome" 
              component={Welcome} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={Home} 
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
                name="Sidebar" 
                component={Sidebar} 
                options={{ headerShown: false }}
              />
          <Stack.Screen 
            name="AdminHome" 
            component={AdminHome} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminProducts" 
            component={AdminProducts} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CreateProduct" 
            component={CreateProduct} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ViewProducts" 
            component={ViewProducts} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="UpdateProduct" 
            component={UpdateProduct} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="DeleteProduct" 
            component={DeleteProduct} 
            options={{ headerShown: false }}
          />
            </>
        ) : (
          <Stack.Screen 
            name="MainApp" 
            options={{ headerShown: false }}
          >
            {props => <SidebarContainer {...props} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      </NavigationContainer>
    );
};

export default AppNavigator;