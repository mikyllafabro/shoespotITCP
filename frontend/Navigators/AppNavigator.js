import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../Screens/Home/Home";
import Login from "../auth/Login";
import SignUp from "../auth/SignUp";
import index from "../Screens/index";
import AdminHome from "../Screens/Admin/AdminHome";
import AdminProducts from "../Screens/Admin/AdminProducts";
import CreateProduct from "../Screens/Admin/CreateProduct";
import ViewProducts from "../Screens/Admin/ViewProducts";
import UpdateProduct from "../Screens/Admin/UpdateProduct";
import DeleteProduct from "../Screens/Admin/DeleteProduct";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen 
            name="Welcome" 
            component={index} 
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
            name="Home" 
            component={Home} 
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
        </Stack.Navigator>
      </NavigationContainer>
    );
};

export default AppNavigator;