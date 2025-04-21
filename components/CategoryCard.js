import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const CategoryCard = ({ category, onPress }) => {
  const { theme } = useTheme();
  
  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    title: {
      ...styles.title,
      color: theme.text,
    },
    count: {
      ...styles.count,
      color: theme.textSecondary,
    },
    iconPlaceholder: {
      ...styles.iconPlaceholder,
      backgroundColor: category.color ? `${category.color}20` : `${theme.primary}20`,
    }
  };
  
  return (
    <TouchableOpacity 
      style={themedStyles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {category.imageUrl ? (
          <Image 
            source={{ uri: category.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={themedStyles.iconPlaceholder}>
            <Ionicons 
              name={category.icon || 'grid-outline'} 
              size={32} 
              color={category.color || theme.primary} 
            />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={themedStyles.title}>{category.title}</Text>
        <Text style={themedStyles.count}>
          {category.count} {category.count === 1 ? 'sign' : 'signs'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  iconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default React.memo(CategoryCard, (prevProps, nextProps) => {
  return prevProps.category.title === nextProps.category.title &&
         prevProps.category.count === nextProps.category.count;
});
