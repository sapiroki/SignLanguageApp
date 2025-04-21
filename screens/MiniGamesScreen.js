import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const MiniGamesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const gameOptions = [
    {
      id: 'flashcards',
      title: t('minigames_flashcards_title'),
      description: t('minigames_flashcards_description'),
      icon: 'albums-outline',
      iconColor: '#4e92df',
      implemented: true,
    },
    {
      id: 'matching',
      title: t('minigames_matching_title'),
      description: t('minigames_matching_description'),
      icon: 'grid-outline',
      iconColor: '#7c4dff',
      implemented: true,
    }
  ];

  const handleSelectGame = useCallback((gameId) => {
    if (gameId === 'flashcards') {
      navigation.navigate('Flashcards');
    } else if (gameId === 'matching') {
      navigation.navigate('MatchingGame');
    }
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('minigames_title')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('minigames_subtitle')}</Text>
      </View>
      <View style={styles.gamesContainer}>
        {gameOptions.map(game => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameCard, 
              { backgroundColor: theme.surface, borderColor: theme.border },
              !game.implemented && { opacity: 0.7 }
            ]}
            onPress={() => handleSelectGame(game.id)}
            activeOpacity={game.implemented ? 0.7 : 1}
          >
            <View style={[styles.gameIcon, { backgroundColor: game.iconColor + '30' }]}>
              <Ionicons name={game.icon} size={32} color={game.iconColor} />
            </View>
            <View style={styles.gameContent}>
              <Text style={[styles.gameTitle, { color: theme.text }]}>{game.title}</Text>
              <Text style={[styles.gameDescription, { color: theme.textSecondary }]}>
                {game.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  gamesContainer: { padding: 16, flex: 1 },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  gameContent: { flex: 1 },
  gameTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  gameDescription: { fontSize: 14 }
});

export default MiniGamesScreen;