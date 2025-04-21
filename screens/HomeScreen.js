import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryCard from '../components/CategoryCard';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getTotalSignCount, getAllCategoryCounts } from '../utils/signUtils';
import { getLocalizedCategories } from '../utils/localizationUtils';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t, currentLanguage, languageVersion } = useLanguage();

  const totalSigns = useMemo(() => getTotalSignCount(), []);
  const categoryCounts = useMemo(() => getAllCategoryCounts(), []);
  const localizedCategories = useMemo(() => 
    getLocalizedCategories(currentLanguage),
    [currentLanguage, languageVersion]
  );
  const categoriesWithCounts = useMemo(() => 
    localizedCategories.map(category => ({
      ...category,
      count: categoryCounts[category.id] || 0
    })),
    [localizedCategories, categoryCounts]
  );

  const navigateToCategory = useCallback((id, title) => {
    navigation.navigate('Category', { id, title });
  }, [navigation]);

  const renderCategoryItem = useCallback(({ item }) => (
    <CategoryCard
      category={item}
      onPress={() => navigateToCategory(item.id, item.title)}
    />
  ), [navigateToCategory]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: theme.background,
    },
    footer: {
      ...styles.footer,
      borderTopColor: theme.border,
    },
    footerText: {
      ...styles.footerText,
      color: theme.textSecondary,
    },
  };

  return (
    <SafeAreaView style={themedStyles.container}>
      <FlatList
        data={categoriesWithCounts}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />
      <View style={themedStyles.footer}>
        <Text style={themedStyles.footerText}>
          {t('home_total_signs', { count: totalSigns })}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
  },
});

export default HomeScreen;
