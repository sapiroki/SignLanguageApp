import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import VideoPlayer from '../components/VideoPlayer';
import { Ionicons } from '@expo/vector-icons';
import CustomTipBox from '../components/CustomTipBox';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedSigns } from '../utils/localizationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LearningScreen = ({ route, navigation }) => {
  const { 
    categoryId = null,
    title = 'Signs', 
    signs = [], 
    allSigns = [],
    isReview = false
  } = route?.params || {};
  
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayVideos, setAutoPlayVideos] = useState(null);
  
  const localizedSigns = useMemo(() => getLocalizedSigns(signs, currentLanguage), 
    [signs, currentLanguage]);
  const localizedAllSigns = useMemo(() => getLocalizedSigns(allSigns, currentLanguage), 
    [allSigns, currentLanguage]);

  useEffect(() => {
    const loadAutoPlayPreference = async () => {
      try {
        const autoPlayStr = await AsyncStorage.getItem('autoPlayVideos');
        setAutoPlayVideos(autoPlayStr === 'true');
      } catch (error) {
        console.error('Error loading auto-play preference:', error);
      }
    };
    
    loadAutoPlayPreference();
  }, []);
  
  useEffect(() => {
    setCurrentIndex(0);
  }, [currentLanguage]);

  useEffect(() => {
    const preventNavigation = (e) => {
      e.preventDefault();
      
      Alert.alert(
        t('learning_exit_title'),
        t('learning_exit_message'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('leave'),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    };

    const unsubscribe = navigation.addListener('beforeRemove', preventNavigation);
    return unsubscribe;
  }, [navigation, t]);

  const handleNext = () => {
    if (currentIndex < localizedSigns.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      
      navigation.navigate('Quiz', {
        signs: localizedSigns,
        categoryId,
        title,
        allCategorySigns: localizedAllSigns,
        isReview: isReview
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (localizedSigns.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.text, marginTop: 16 }}>{t('learning_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSign = localizedSigns[currentIndex];
  const isLastSign = currentIndex === localizedSigns.length - 1;
  const progressPercentage = ((currentIndex + 1) / localizedSigns.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.videoContainer}>
          <VideoPlayer 
            videoUrl={currentSign.videoUrl} 
            autoPlay={autoPlayVideos}
          />
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { 
            backgroundColor: theme.border,
          }]}>
            <View 
              style={[
                styles.progressFill, 
                { backgroundColor: theme.primary, width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {t('learning_progress', { current: currentIndex + 1, total: localizedSigns.length })}
          </Text>
        </View>
        
        <ScrollView style={styles.signContainer} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={[styles.signWord, { color: theme.text }]}>{currentSign.word}</Text>
          <CustomTipBox 
            signId={currentSign?.id} 
            containerStyle={{marginTop: 8}} 
          />
        </ScrollView>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navigationButton, { 
              backgroundColor: theme.textSecondary,
              opacity: currentIndex === 0 ? 0.5 : 1 
            }]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={[styles.navigationButtonText, { color: theme.onPrimary }]}>
              {t('learning_button_previous')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navigationButton, { backgroundColor: theme.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.navigationButtonText, { color: theme.onPrimary }]}>
              {isLastSign ? t('learning_button_start_quiz') : t('learning_button_next')}
            </Text>
            <Ionicons name={isLastSign ? "school" : "arrow-forward"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'right',
  },
  signContainer: {
    margin: 16,
    flex: 1,
  },
  signWord: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 24,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: 140,
  },
  navigationButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LearningScreen;
