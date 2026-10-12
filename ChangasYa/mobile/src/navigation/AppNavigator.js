import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import RequestWaitingScreen from '../screens/RequestWaitingScreen';
import RatingScreen from '../screens/RatingScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import WorkerHomeScreen from '../screens/WorkerHomeScreen';
import WorkerRequestScreen from '../screens/WorkerRequestScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RequestWaiting" component={RequestWaitingScreen} options={{ title: 'Buscando profesional' }} />
        <Stack.Screen name="Rating" component={RatingScreen} options={{ title: 'Calificar' }} />
        <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} options={{ title: 'Trabajá con nosotros' }} />
        <Stack.Screen name="WorkerHome" component={WorkerHomeScreen} options={{ title: 'Panel de trabajador' }} />
        <Stack.Screen name="WorkerRequest" component={WorkerRequestScreen} options={{ title: 'Changa entrante' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
