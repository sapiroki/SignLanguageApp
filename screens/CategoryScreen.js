import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signsData } from '../data/signs';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getLearnedSigns, getNextSignsToLearn } from '../utils/learningUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedSigns, getLocalizedCategoryTitle } from '../utils/localizationUtils';

const CategoryScreen = ({ route, navigation }) => {
  const { id: categoryId = null, title = 'Category' } = route?.params || {};
  const { theme } = useTheme();
  const { t, currentLanguage, languageVersion } = useLanguage();
  const [learnedSigns, setLearnedSigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextBatch, setNextBatch] = useState([]);
  const [localizedSigns, setLocalizedSigns] = useState([]);
  const [learnSignsCount, setLearnSignsCount] = useState(5);
  const [repeatSignsCount, setRepeatSignsCount] = useState(5);

  const categoryTitle = useMemo(() => 
    categoryId ? getLocalizedCategoryTitle(categoryId, currentLanguage) : title,
    [categoryId, currentLanguage, title]
  );
  
  const signs = useMemo(() => 
    categoryId ? signsData.filter(sign => sign.categoryId === categoryId) : [],
    [categoryId]
  );

  const stats = useMemo(() => {
    const learnedInCategory = learnedSigns.filter(id => 
      signs.some(sign => sign.id === id)
    ).length;
    
    const remaining = signs.length - learnedInCategory;
    const percentage = signs.length > 0 ? Math.round((learnedInCategory / signs.length) * 100) : 0;
    
    return { learned: learnedInCategory, remaining, percentage };
  }, [signs, learnedSigns]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [learned, learnCountStr, repeatCountStr] = await Promise.all([
          getLearnedSigns(),
          AsyncStorage.getItem('learnSignsCount'),
          AsyncStorage.getItem('repeatSignsCount')
        ]);
        
        setLearnedSigns(learned);
        setLearnSignsCount(learnCountStr ? parseInt(learnCountStr, 10) : 5);
        setRepeatSignsCount(repeatCountStr ? parseInt(repeatCountStr, 10) : 5);
        
        const localized = getLocalizedSigns(signs, currentLanguage);
        setLocalizedSigns(localized);
        
        if (categoryId) {
          const batch = await getNextSignsToLearn(localized, 
            learnCountStr ? parseInt(learnCountStr, 10) : 5);
          setNextBatch(batch);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [categoryId, navigation, currentLanguage, languageVersion, signs]);

  const handleLearnPress = () => {
    if (categoryId && nextBatch.length > 0) {
      navigation.navigate('Learning', {
        categoryId,
        title: categoryTitle,
        signs: nextBatch,
        allSigns: localizedSigns
      });
    }
  };

  const handleRepeatPress = () => {
    const learnedSignsInCategory = localizedSigns.filter(sign => 
      learnedSigns.includes(sign.id)
    );
    
    if (learnedSignsInCategory.length > 0) {
      const shuffledSigns = [...learnedSignsInCategory].sort(() => 0.5 - Math.random());
      const reviewBatch = shuffledSigns.slice(0, repeatSignsCount);
      
      navigation.navigate('Quiz', {
        signs: reviewBatch,
        categoryId,
        title: categoryTitle,
        allCategorySigns: localizedSigns,
        isReview: true
      });
    }
  };

  const renderSignItem = ({ item, index }) => {
    const isLearned = learnedSigns.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.listItem, { 
          backgroundColor: theme.surface,
          borderBottomColor: theme.border
        }]}
        onPress={() => 
          navigation.navigate('SignDetail', { 
            id: item.id, 
            title: item.word,
            categoryId, 
            categoryTitle
          })
        }
      >
        <Text style={[styles.itemNumber, { color: theme.primary }]}>{index + 1}. </Text>
        <Text style={[styles.itemText, { color: theme.text }]}>{item.word}</Text>
        {isLearned && (
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.progressCard, { 
        backgroundColor: theme.surface,
        borderColor: theme.border 
      }]}>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={[styles.progressCount, { color: theme.primary }]}>
              {stats.learned}
            </Text>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {t('category_learned')}
            </Text>
          </View>
          
          <View style={[styles.progressDivider, { backgroundColor: theme.border }]} />
          
          <View style={styles.progressItem}>
            <Text style={[styles.progressCount, { color: theme.primary }]}>
              {stats.remaining}
            </Text>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {t('category_remaining')}
            </Text>
          </View>
          
          <View style={[styles.progressDivider, { backgroundColor: theme.border }]} />
          
          <View style={styles.progressItem}>
            <Text style={[styles.progressCount, { color: theme.primary }]}>
              {stats.percentage}%
            </Text>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {t('category_complete')}
            </Text>
          </View>
        </View>
      </View>

      {localizedSigns.length > 0 ? (
        <>
          <View style={styles.buttonsContainer}>
            {stats.remaining > 0 ? (
              <TouchableOpacity 
                style={[styles.learnButton, { backgroundColor: theme.primary }]} 
                onPress={handleLearnPress}
              >
                <Ionicons 
                  name="school-outline" 
                  size={24} 
                  color={theme.onPrimary} 
                  style={styles.buttonIcon}
                />
                <Text style={[styles.learnButtonText, { color: theme.onPrimary }]}>
                  {t('category_button_learn')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.learnButton, { backgroundColor: theme.primary, opacity: 0.5 }]}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={theme.onPrimary} 
                  style={styles.buttonIcon}
                />
                <Text style={[styles.learnButtonText, { color: theme.onPrimary }]}>
                  {t('category_button_all_complete')}
                </Text>
              </View>
            )}
            
            {stats.learned > 0 ? (
              <TouchableOpacity
                style={[styles.repeatButton, { borderColor: theme.primary }]}
                onPress={handleRepeatPress}
              >
                <Ionicons 
                  name="refresh-outline" 
                  size={24} 
                  color={theme.primary} 
                  style={styles.buttonIcon}
                />
                <Text style={[styles.repeatButtonText, { color: theme.primary }]}>
                  {t('category_button_repeat')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.repeatButton, { borderColor: theme.primary, opacity: 0.5 }]}>
                <Ionicons 
                  name="refresh-outline" 
                  size={24} 
                  color={theme.primary} 
                  style={styles.buttonIcon}
                />
                <Text style={[styles.repeatButtonText, { color: theme.primary }]}>
                  {t('category_button_repeat')}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderText, { color: theme.textSecondary }]}>
              {t('category_all_signs')}
            </Text>
          </View>
          
          <FlatList
            data={localizedSigns}
            renderItem={renderSignItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: theme.textSecondary }}>
            {t('category_no_signs')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressCard: {
    margin: 12,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 36,
  },
  progressCount: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  learnButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 6,
  },
  learnButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  repeatButton: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 6,
    borderWidth: 1.5,
  },
  repeatButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginBottom: 4,
  },
  listHeader: {
    marginHorizontal: 12,
    marginBottom: 4,
  },
  listHeaderText: {
    fontSize: 14,
    marginTop: 8,
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 28,
    textAlign: 'right',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default CategoryScreen;
