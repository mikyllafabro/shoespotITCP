import React from "react";
import { Provider } from "react-redux";
import store from "./Context/Store/productStore"; // Change to use productStore
import { AuthProvider } from "./Context/Actions/AuthContext";
import AppNavigator from "./Navigators/AppNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}