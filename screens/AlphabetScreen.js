import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const alphabetImage = require('../assets/images/eesti_sormendid.png');

const AlphabetScreen = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>{t('alphabet_title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('alphabet_subtitle')}
        </Text>
        <View style={[styles.imageContainer, { 
          backgroundColor: theme.surface,
          borderColor: imageLoaded ? theme.border : 'transparent',
          padding: imageLoaded ? 16 : 0,
        }]}>
          <Image 
            source={alphabetImage}
            style={styles.alphabetImage}
            resizeMode="contain"
            onLoad={() => setImageLoaded(true)}
            onError={() => console.log("Error loading alphabet image")}
          />
          {!imageLoaded && (
            <View style={styles.loadingOverlay}>
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                {t('alphabet_loading')}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.tipContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.tipTitle, { color: theme.text }]}>
            {t('alphabet_practice_tip')}
          </Text>
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            {t('alphabet_tip_content')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: '100%',
    minHeight: 400, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 20,
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  alphabetImage: {
    width: '100%',
    height: 400,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AlphabetScreen;
