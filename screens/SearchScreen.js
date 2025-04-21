import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signsData } from '../data/signs';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getLearnedSigns } from '../utils/learningUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalizedSigns } from '../utils/localizationUtils';

const FAVORITE_SIGNS_KEY = '@estonian_sign_app:favorite_signs';

const SearchScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [learnedSigns, setLearnedSigns] = useState([]);
  const [favoriteSigns, setFavoriteSigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const learned = await getLearnedSigns();
      const favorites = JSON.parse(await AsyncStorage.getItem(FAVORITE_SIGNS_KEY) || '[]');
      
      setLearnedSigns(learned);
      setFavoriteSigns(favorites);
      
      const localizedData = getLocalizedSigns(signsData, currentLanguage);
      setAllResults(localizedData);
      applyFiltersAndSorting(localizedData, learned, favorites, activeFilter, sortAlphabetically);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, activeFilter, sortAlphabetically]);

  useEffect(() => {
    loadUserData();
    return navigation.addListener('focus', loadUserData);
  }, [navigation, loadUserData]);

  const applyFiltersAndSorting = useCallback((baseResults, learned = learnedSigns, 
    favorites = favoriteSigns, filter = activeFilter, sort = sortAlphabetically) => {
    if (!Array.isArray(baseResults)) baseResults = [];
    
    let filteredResults = [...baseResults];
    
    if (filter === 'learned') {
      filteredResults = filteredResults.filter(sign => learned.includes(sign.id));
    } else if (filter === 'favorite') {
      filteredResults = filteredResults.filter(sign => favorites.includes(sign.id));
    }
    
    if (sort) {
      filteredResults.sort((a, b) => a.word.localeCompare(b.word));
    }
    
    setResults(filteredResults);
  }, [learnedSigns, favoriteSigns, activeFilter, sortAlphabetically]);
  
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    const normalizedQuery = text.trim().toLowerCase();
    
    if (!normalizedQuery) {
      const localizedData = getLocalizedSigns(signsData, currentLanguage);
      setAllResults(localizedData);
      applyFiltersAndSorting(localizedData);
      return;
    }
    
    const localizedData = getLocalizedSigns(signsData, currentLanguage);
    const filtered = localizedData.filter(sign => {
      const normalizedWord = sign.word.toLowerCase();
      
      if (normalizedQuery.length === 1) {
        return normalizedWord.includes(normalizedQuery);
      }
      
      if (normalizedQuery.length >= 2 && normalizedWord.includes(normalizedQuery)) {
        return true;
      }
      
      if (normalizedWord.startsWith(normalizedQuery)) {
        return true;
      }
      
      if (Array.isArray(sign.keywords)) {
        return sign.keywords.some(keyword => {
          if (!keyword) return false;
          
          if (keyword.toLowerCase().startsWith(normalizedQuery)) {
            return true;
          }
          
          if (normalizedQuery.length >= 3) {
            const keywordWords = keyword.toLowerCase().split(/\s+/);
            return keywordWords.includes(normalizedQuery) || keyword.toLowerCase().includes(normalizedQuery);
          }
          
          return false;
        });
      }
      
      return false;
    });
    
    setAllResults(filtered);
    applyFiltersAndSorting(filtered);
  }, [currentLanguage, applyFiltersAndSorting]);

  const handleFilterChange = useCallback(filter => {
    setActiveFilter(filter);
    applyFiltersAndSorting(allResults, learnedSigns, favoriteSigns, filter, sortAlphabetically);
  }, [allResults, learnedSigns, favoriteSigns, sortAlphabetically, applyFiltersAndSorting]);
  
  const toggleSorting = useCallback(() => {
    const newSortValue = !sortAlphabetically;
    setSortAlphabetically(newSortValue);
    applyFiltersAndSorting(allResults, learnedSigns, favoriteSigns, activeFilter, newSortValue);
  }, [allResults, learnedSigns, favoriteSigns, activeFilter, sortAlphabetically, applyFiltersAndSorting]);
  
  const renderSignItem = useCallback(({ item }) => {
    const isFavorite = favoriteSigns.includes(item.id);
    const isLearned = learnedSigns.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.listItem, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('SearchDetail', { id: item.id, title: item.word })}
      >
        <View style={styles.listItemContent}>
          <Text style={[styles.listItemTitle, { color: theme.text }]}>{item.word}</Text>
        </View>
        
        <View style={styles.listItemBadges}>
          {isLearned && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.badgeIcon} />}
          {isFavorite && <Ionicons name="heart" size={20} color="#ff3b30" style={styles.badgeIcon} />}
        </View>
      </TouchableOpacity>
    );
  }, [favoriteSigns, learnedSigns, navigation, theme.surface, theme.text]);

  const filterOptions = [
    { id: 'all', icon: 'apps-outline', label: t('search_filter_all') },
    { id: 'learned', icon: 'checkmark-circle-outline', label: t('search_filter_learned') },
    { id: 'favorite', icon: 'heart-outline', label: t('search_filter_favorites') }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.searchContainer, { 
        backgroundColor: theme.surface,
        borderColor: theme.border,
        marginTop: 6 
      }]}>
        <Ionicons name="search" size={24} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t('search_placeholder')}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.controlsRow}>
        <View style={[styles.filterContainer, { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
          flex: 1,
          marginBottom: 4 
        }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.map(filter => (
              <TouchableOpacity 
                key={filter.id}
                style={[
                  styles.filterButton,
                  activeFilter === filter.id && [styles.activeFilterButton, {
                    backgroundColor: theme.primary + '20',
                    borderColor: theme.primary
                  }]
                ]}
                onPress={() => handleFilterChange(filter.id)}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={16} 
                  color={activeFilter === filter.id ? theme.primary : theme.textSecondary} 
                />
                <Text 
                  style={[
                    { color: theme.textSecondary },
                    activeFilter === filter.id && { color: theme.primary, fontWeight: '500' }
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <TouchableOpacity 
          style={[styles.sortButtonMinimal, { 
            backgroundColor: sortAlphabetically ? theme.primary + '20' : 'transparent',
            borderColor: sortAlphabetically ? theme.primary : theme.border,
            marginLeft: 8,
            marginRight: 16 
          }]}
          onPress={toggleSorting}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={sortAlphabetically ? "text" : "text-outline"} 
            size={20} 
            color={sortAlphabetically ? theme.primary : theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      {results.length > 0 && (
        <Text style={[styles.resultsHeader, { 
          color: theme.textSecondary,
          paddingVertical: 2,
          paddingHorizontal: 16 
        }]}>
          {results.length} {results.length === 1 ? t('search_sign') : t('search_signs')} {t('search_found')}
        </Text>
      )}
      
      {results.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle-outline" size={80} color={theme.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            {t('search_no_results')}
          </Text>
          <Text style={[styles.emptyStateText, { 
            color: theme.textSecondary,
            fontSize: 14,
            marginTop: 8,
            opacity: 0.7 
          }]}>
            {searchQuery ? t('search_try_different') : t('search_try_filters')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderSignItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  activeFilterButton: {
    borderWidth: 1,
  },
  sortButtonMinimal: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 0,
    paddingTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  listItemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchScreen;
