import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayer from '../components/VideoPlayer';
import CustomTipBox from '../components/CustomTipBox';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedSign, getLocalizedCategoryTitle } from '../utils/localizationUtils';

const FAVORITE_SIGNS_KEY = '@estonian_sign_app:favorite_signs';

const SignDetailScreen = ({ route, navigation }) => {
  const { id, previousScreen, categoryId, categoryTitle: origCategoryTitle } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = useState(null);
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  
  const sign = getLocalizedSign(id, currentLanguage) || {
    word: 'Loading...',
    description: 'Sign information not available',
    videoUrl: null
  };
  
  const categoryTitle = categoryId ? getLocalizedCategoryTitle(categoryId, currentLanguage) : origCategoryTitle;

  useEffect(() => {
    const loadData = async () => {
      try {
        const favoritesJson = await AsyncStorage.getItem(FAVORITE_SIGNS_KEY);
        const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
        setIsFavorite(favorites.includes(id));
        
        const autoPlayStr = await AsyncStorage.getItem('autoPlayVideos');
        setAutoPlayVideos(autoPlayStr === 'true');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const handleCustomBack = () => {
      if (previousScreen === 'Search') {
        navigation.navigate('Search');
        return true;
      } 
      else if (categoryId) {
        navigation.navigate('Category', { id: categoryId, title: categoryTitle || 'Category' });
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleCustomBack);
    return () => backHandler.remove();
  }, [navigation, previousScreen, categoryId, categoryTitle]);
  
  useEffect(() => {
    const headerLeft = () => (
      <TouchableOpacity 
        style={{ marginLeft: 16 }}
        onPress={() => {
          if (previousScreen === 'Search') {
            navigation.navigate('Search');
          } else if (categoryId) {
            navigation.navigate('Category', { id: categoryId, title: categoryTitle || 'Category' });
          } else {
            navigation.goBack();
          }
        }}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
    );
    
    navigation.setOptions({
      headerLeft: previousScreen === 'Search' || categoryId ? headerLeft : undefined
    });
  }, [navigation, theme.text, previousScreen, categoryId, categoryTitle]);
  
  const toggleFavorite = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem(FAVORITE_SIGNS_KEY);
      const favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      const newFavorites = isFavorite
        ? favorites.filter(signId => signId !== id)
        : [...favorites, id];
      
      await AsyncStorage.setItem(FAVORITE_SIGNS_KEY, JSON.stringify(newFavorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.videoContainer}>
          <VideoPlayer 
            videoUrl={sign.videoUrl} 
            autoPlay={autoPlayVideos}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{sign.word}</Text>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFavorite ? 'red' : theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          <CustomTipBox 
            signId={id} 
            containerStyle={{marginTop: 8, marginBottom: 20}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
  },
  infoContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
  }
});

export default SignDetailScreen;
