import React from "react";
import { Provider } from "react-redux";
import store from "./Context/Store/productStore"; // Change to use productStore
import AppNavigator from "./Navigators/AppNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}