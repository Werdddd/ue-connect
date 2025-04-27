import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View } from 'react-native';
import Login from './Pages/login'; 
import SignUp from './Pages/signup';
import Tutorial from './Pages/tutorial.js';
import Landing from './Pages/landing.js';
import Start from './Pages/start.js';
import Home from './Pages/home.js';
import Template from './Pages/templatePage.js';
import OrganizationPage from './Pages/organizationPage.js';
import Events from './Pages/eventPage.js';


const Stack = createStackNavigator();

export default function App() {
  console.log("App is rendering");

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="OrganizationPage" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={Landing} />
        <Stack.Screen name="Tutorial" component={Tutorial} />
        <Stack.Screen name="Start" component={Start} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Template" component={Template} />
        <Stack.Screen name="OrganizationPage" component={OrganizationPage} />
        <Stack.Screen name="Events" component={Events} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
