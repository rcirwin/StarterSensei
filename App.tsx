import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/Feather';
import { SplashScreen } from './src/components/SplashScreen';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import {
  RobotoMono_400Regular,
} from '@expo-google-fonts/roboto-mono';

import { StarterListScreen } from './src/screens/StarterListScreen';
import { AddStarterScreen } from './src/screens/AddStarterScreen';
import { StarterDetailScreen } from './src/screens/StarterDetailScreen';
import { CameraCaptureScreen } from './src/screens/CameraCaptureScreen';
import { AnalysisResultsScreen } from './src/screens/AnalysisResultsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';
import { paperTheme } from './src/theme/paperTheme';
import { BottomTabParamList, RootStackParamList } from './src/types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();



// Placeholder screens for navigation
const EditStarterScreen = () => null;

function StartersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StarterList" component={StarterListScreen} />
      <Stack.Screen name="StarterDetail" component={StarterDetailScreen} />
      <Stack.Screen name="AddStarter" component={AddStarterScreen} />
      <Stack.Screen name="EditStarter" component={EditStarterScreen} />
      <Stack.Screen name="CameraCapture" component={CameraCaptureScreen} />
      <Stack.Screen name="PhotoAnalysisDetail" component={AnalysisResultsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Starters') {
            iconName = 'activity'; // Using activity icon for flask-like appearance
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.disabled,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Starters" component={StartersStack} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    RobotoMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Show splash for 2 seconds after fonts are loaded
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || showSplash) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <BottomTabs />
      </NavigationContainer>
    </PaperProvider>
  );
} 