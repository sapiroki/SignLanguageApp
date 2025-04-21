import React, { useMemo, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TabBarIcon from './components/TabBarIcon';
import { Platform } from 'react-native';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import SignDetailScreen from './screens/SignDetailScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import LearningScreen from './screens/LearningScreen';
import QuizScreen from './screens/QuizScreen';
import AlphabetScreen from './screens/AlphabetScreen';
import MiniGamesScreen from './screens/MiniGamesScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import MatchingGameScreen from './screens/MatchingGameScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();

const getScreenOptions = (theme) => ({
  headerStyle: {
    backgroundColor: theme.surface,
  },
  headerTintColor: theme.text,
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  cardStyle: { backgroundColor: theme.background }
});

function SearchStackScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <SearchStack.Navigator screenOptions={getScreenOptions(theme)}>
      <SearchStack.Screen 
        name="SearchHome" 
        component={SearchScreen} 
        options={{ title: t('nav_search') }} 
      />
      <SearchStack.Screen 
        name="SearchDetail" 
        component={SignDetailScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || t('nav_sign_detail')
        })}
      />
    </SearchStack.Navigator>
  );
}

const MainStack = React.memo(function MainStack() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const screenOptions = useMemo(() => ({
    ...getScreenOptions(theme),
    headerTitleAlign: 'center',
  }), [theme]);
  
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={screenOptions}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: t('app_name'),
          headerTitleAlign: 'center',
        }} 
      />
      <Stack.Screen 
        name="Category" 
        component={CategoryScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || t('nav_category'),
          headerTitleAlign: 'center',
        })}
      />
      <Stack.Screen 
        name="SignDetail" 
        component={SignDetailScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || t('nav_sign_detail'),
          headerTitleAlign: 'center',
        })}
      />
      <Stack.Screen 
        name="Learning" 
        component={LearningScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || t('nav_learning'),
          headerTitleAlign: 'center',
        })}
      />
      <Stack.Screen 
        name="Quiz" 
        component={QuizScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || t('nav_quiz'),
          headerTitleAlign: 'center',
        })}
      />
      <Stack.Screen 
        name="Alphabet" 
        component={AlphabetScreen} 
        options={{ 
          title: t('alphabet_title'),
          headerTitleAlign: 'center',
        }} 
      />
    </Stack.Navigator>
  );
});

const MiniGamesStack = React.memo(function MiniGamesStack() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <Stack.Navigator screenOptions={getScreenOptions(theme)}>
      <Stack.Screen 
        name="MiniGamesHome" 
        component={MiniGamesScreen} 
        options={{ 
          title: t('nav_minigames')
        }}
      />
      <Stack.Screen 
        name="Flashcards" 
        component={FlashcardsScreen} 
        options={{ 
          title: t('flashcards_title')
        }}
      />
      <Stack.Screen
        name="MatchingGame"
        component={MatchingGameScreen}
        options={{
          title: t('matching_title')
        }}
      />
    </Stack.Navigator>
  );
});

function MainApp() {
  const { theme, isDarkMode } = useTheme();
  const { t, isLoading, languageVersion, currentLanguage } = useLanguage();
  
  const navigationTheme = useMemo(() => ({
    dark: isDarkMode,
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    }
  }), [isDarkMode, theme]);

  const screenOptions = useCallback(({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;

      if (route.name === 'Main') {
        iconName = focused ? 'home' : 'home-outline';
      } else if (route.name === 'Search') {
        iconName = focused ? 'search' : 'search-outline';
      } else if (route.name === 'Alphabet') {
        iconName = focused ? 'text' : 'text-outline';
      } else if (route.name === 'MiniGames') {
        iconName = focused ? 'game-controller' : 'game-controller-outline';
      } else if (route.name === 'Settings') {
        iconName = focused ? 'settings' : 'settings-outline';
      }

      return <TabBarIcon name={iconName} focused={focused} color={color} size={size} />;
    },
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.textSecondary,
    tabBarLabelStyle: { 
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
      paddingBottom: 0,
    },
    tabBarStyle: {
      height: Platform.OS === 'ios' ? 88 : 65,
      paddingTop: 5,
      paddingBottom: Platform.OS === 'ios' ? 28 : 10,
      elevation: 8,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: -2 },
      borderTopColor: theme.border,
      borderTopWidth: 1,
      backgroundColor: theme.tabBarBackground,
    },
    tabBarItemStyle: {
      paddingTop: 5,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: Platform.OS === 'ios' ? 50 : 55,
    },
    headerStyle: {
      backgroundColor: theme.surface,
    },
    headerTintColor: theme.text,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  }), [theme]);
  
  if (isLoading) {
    return <></>;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        key={`tab-navigator-${languageVersion}-${currentLanguage}`}
        screenOptions={screenOptions}
        detachInactiveScreens={true}
      >
        <Tab.Screen 
          name="Main" 
          component={MainStack} 
          options={{ 
            headerShown: false,
            title: t('nav_home')
          }} 
        />
        
        <Tab.Screen 
          name="Search" 
          component={SearchStackScreen} 
          options={{ 
            headerShown: false,
            title: t('nav_search')
          }}
        />
        
        <Tab.Screen 
          name="Alphabet" 
          component={AlphabetScreen} 
          options={{
            title: t('nav_alphabet')
          }}
        />
        
        <Tab.Screen 
          name="MiniGames" 
          component={MiniGamesStack} 
          options={{
            headerShown: false,
            title: t('nav_minigames')
          }}
        />
        
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{
            title: t('nav_settings')
          }}
        />
      </Tab.Navigator>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
