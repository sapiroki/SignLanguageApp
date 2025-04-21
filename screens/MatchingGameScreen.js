import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import VideoPlayer from '../components/VideoPlayer';
import { signsData } from '../data/signs';
import { getLocalizedSigns, getLocalizedCategories } from '../utils/localizationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllCategoryCounts } from '../utils/signUtils';
import { getLearnedSigns } from '../utils/learningUtils';

const { width } = Dimensions.get('window');
const BATCH_SIZE = 3; 

const MatchingGameScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  
  const [showCategoryModal, setShowCategoryModal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allPairs, setAllPairs] = useState([]);
  const [currentPairs, setCurrentPairs] = useState([]);
  const [videoItems, setVideoItems] = useState([]);
  const [textItems, setTextItems] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [totalMatchedPairs, setTotalMatchedPairs] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameDuration, setGameDuration] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [autoPlayVideos, setAutoPlayVideos] = useState(false);
  const [learnedSigns, setLearnedSigns] = useState([]);
  const [categoryCompletionStatus, setCategoryCompletionStatus] = useState({});
  
  const localizedCategories = getLocalizedCategories(currentLanguage);
  const categoryCounts = getAllCategoryCounts();
  const categoriesWithCorrectCounts = localizedCategories.map(category => ({
    ...category,
    count: categoryCounts[category.id] || 0
  }));

  useEffect(() => {
    AsyncStorage.getItem('autoPlayVideos')
      .then(autoPlayStr => setAutoPlayVideos(autoPlayStr === 'true'))
      .catch(() => setAutoPlayVideos(false));
  }, []);
  
  useEffect(() => {
    if (selectedCategory) loadMatchingGame();
  }, [selectedCategory, currentLanguage]);
  
  useEffect(() => {
    let interval;
    if (gameStartTime && !gameComplete) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [gameStartTime, gameComplete]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const learned = await getLearnedSigns();
        setLearnedSigns(learned);
        
        const completionStatus = {};
        localizedCategories.forEach(category => {
          const categorySigns = signsData.filter(sign => sign.categoryId === category.id);
          const totalInCategory = categorySigns.length;
          
          if (totalInCategory === 0) {
            completionStatus[category.id] = false;
            return;
          }
          
          const learnedInCategory = categorySigns.filter(sign => 
            learned.includes(sign.id)
          ).length;
          
          completionStatus[category.id] = (learnedInCategory === totalInCategory);
        });
        
        setCategoryCompletionStatus(completionStatus);
      } catch (error) {
        console.error('Error loading learned signs:', error);
      }
    };
    
    loadData();
  }, [localizedCategories]);
  
  const loadMatchingGame = async () => {
    setLoading(true);
    
    try {
      const categorySignsData = signsData.filter(sign => sign.categoryId === selectedCategory.id);
      const localizedCategorySigns = getLocalizedSigns(categorySignsData, currentLanguage);
      const shuffledSigns = [...localizedCategorySigns].sort(() => 0.5 - Math.random());
      
      const gamePairs = shuffledSigns.map(sign => ({
        id: sign.id,
        videoUrl: sign.videoUrl,
        word: sign.word
      }));
      
      setAllPairs(gamePairs);
      
      const batchCount = Math.ceil(gamePairs.length / BATCH_SIZE);
      setTotalBatches(batchCount);
      
      setCurrentBatchIndex(0);
      loadBatch(0, gamePairs);
      
      setMatchedPairs([]);
      setTotalMatchedPairs(0);
      setMistakes(0);
      setGameComplete(false);
      setGameStartTime(Date.now());
      setCurrentTime(0);
      
    } catch (error) {
      console.error('Error loading matching game:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadBatch = (batchIndex, pairs = allPairs) => {
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, pairs.length);
    
    const batchPairs = pairs.slice(startIndex, endIndex);
    setCurrentPairs(batchPairs);
    
    const videos = batchPairs.map((pair, index) => ({
      id: `video-${pair.id}`,
      pairId: pair.id,
      videoUrl: pair.videoUrl,
      type: 'video',
      index
    }));
    
    const texts = batchPairs.map((pair, index) => ({
      id: `text-${pair.id}`,
      pairId: pair.id,
      word: pair.word,
      type: 'text',
      index
    }));
    
    setVideoItems(videos.sort(() => 0.5 - Math.random()));
    setTextItems(texts.sort(() => 0.5 - Math.random()));
    
    setSelectedVideo(null);
    setSelectedText(null);
    setMatchedPairs([]);
  };
  
  const handleSelectCategory = (category) => {
    if (!categoryCompletionStatus[category.id]) {
      Alert.alert(
        t('matching_locked_title'),
        t('matching_locked_message'),
        [{ text: t('ok'), style: 'default' }]
      );
      return;
    }
    
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };
  
  const handleSelectVideo = (item) => {
    if (matchedPairs.includes(item.pairId)) return;
    
    setSelectedVideo(item);
    
    if (selectedText) checkForMatch(item, selectedText);
  };
  
  const handleSelectText = (item) => {
    if (matchedPairs.includes(item.pairId)) return;
    
    setSelectedText(item);
    
    if (selectedVideo) checkForMatch(selectedVideo, item);
  };
  
  const checkForMatch = (video, text) => {
    const isMatch = video.pairId === text.pairId;
    
    if (isMatch) {
      setMatchedPairs(prev => [...prev, video.pairId]);
      setTotalMatchedPairs(prev => prev + 1);
      
      setTimeout(() => {
        setSelectedVideo(null);
        setSelectedText(null);
        
        if (matchedPairs.length + 1 === currentPairs.length) {
          if (totalMatchedPairs + 1 === allPairs.length) {
            const endTime = Date.now();
            const duration = Math.floor((endTime - gameStartTime) / 1000);
            setGameDuration(duration);
            setGameComplete(true);
          }
        }
      }, 500);
    } else {
      setMistakes(prev => prev + 1);
      
      setTimeout(() => {
        setSelectedVideo(null);
        setSelectedText(null);
      }, 1000);
    }
  };
  
  const handleContinueToNextBatch = () => {
    if (currentBatchIndex + 1 < totalBatches) {
      const nextBatchIndex = currentBatchIndex + 1;
      setCurrentBatchIndex(nextBatchIndex);
      loadBatch(nextBatchIndex);
    } else {
      completeGame();
    }
  };
  
  const completeGame = () => {
    const endTime = Date.now();
    const duration = Math.floor((endTime - gameStartTime) / 1000);
    setGameDuration(duration);
    setGameComplete(true);
  };
  
  const handleRestartGame = () => loadMatchingGame();
  const handleChooseNewCategory = () => setShowCategoryModal(true);
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const isBatchComplete = () => currentPairs.length > 0 && matchedPairs.length === currentPairs.length;

  if ((!selectedCategory && !showCategoryModal) || showCategoryModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerText, { color: theme.text }]}>{t('matching_title')}</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>{t('matching_choose_category')}</Text>
        </View>
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => navigation.goBack()}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('matching_select_category')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={categoriesWithCorrectCounts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isCompleted = categoryCompletionStatus[item.id];
                  
                  return (
                    <TouchableOpacity 
                      style={[
                        styles.categoryListItem,
                        { borderBottomColor: theme.border },
                        !isCompleted && styles.categoryListItemLocked
                      ]}
                      onPress={() => handleSelectCategory(item)}
                      activeOpacity={isCompleted ? 0.7 : 1}
                    >
                      <View style={styles.categoryIcon}>
                        <Ionicons 
                          name={item.icon || "grid-outline"} 
                          size={24} 
                          color={item.color || theme.primary} 
                          style={{ opacity: isCompleted ? 1 : 0.5 }}
                        />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={[
                          styles.categoryTitle,
                          { color: theme.text },
                          !isCompleted && { color: theme.textSecondary }
                        ]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
                          {item.count} {t('category_signs')}
                          {!isCompleted && ` • ${t('matching_category_locked')}`}
                        </Text>
                      </View>
                      {isCompleted ? (
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                      ) : (
                        <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.subText, { color: theme.textSecondary }]}>{t('matching_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, { color: theme.text }]}>{selectedCategory.title}</Text>
        <Text style={[styles.subText, { color: theme.textSecondary }]}>
          {t('matching_matches_found')}: {totalMatchedPairs}/{allPairs.length}
        </Text>
      </View>
      
      <View style={styles.gameContainer}>
        <View style={styles.column}>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>{t('matching_videos_title')}</Text>
          <FlatList
            data={videoItems}
            renderItem={({ item }) => {
              const isSelected = selectedVideo?.id === item.id;
              const isMatched = matchedPairs.includes(item.pairId);
              
              return (
                <TouchableOpacity
                  style={[
                    styles.videoItem,
                    { 
                      backgroundColor: theme.surface, 
                      borderColor: isSelected ? theme.primary : 
                                   isMatched ? '#4CAF50' : theme.border,
                      borderWidth: isSelected || isMatched ? 3 : 1,
                      backgroundColor: isSelected ? theme.primary + '20' : 
                                      isMatched ? '#4CAF5020' : theme.surface
                    }
                  ]}
                  onPress={() => handleSelectVideo(item)}
                  disabled={isMatched}
                  activeOpacity={0.7}
                >
                  <VideoPlayer
                    videoUrl={item.videoUrl}
                    resizeMode="cover"
                    compact={true}
                    showControls={true}
                    muted={true}
                    autoPlay={isMatched ? false : autoPlayVideos}
                    disableFullscreenTouch={!isMatched}
                  />
                  {isMatched && (
                    <View style={styles.matchedOverlay}>
                      <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item.id}
            scrollEnabled={true}
            contentContainerStyle={styles.columnContent}
          />
        </View>
        
        <View style={styles.column}>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>{t('matching_words_title')}</Text>
          <FlatList
            data={textItems}
            renderItem={({ item }) => {
              const isSelected = selectedText?.id === item.id;
              const isMatched = matchedPairs.includes(item.pairId);
              
              return (
                <TouchableOpacity
                  style={[
                    styles.textItem,
                    { 
                      backgroundColor: theme.surface, 
                      borderColor: isSelected ? theme.primary : 
                                   isMatched ? '#4CAF50' : theme.border,
                      borderWidth: isSelected || isMatched ? 3 : 1,
                      backgroundColor: isSelected ? theme.primary + '20' : 
                                      isMatched ? '#4CAF5020' : theme.surface
                    }
                  ]}
                  onPress={() => handleSelectText(item)}
                  disabled={isMatched}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.textContent, { color: theme.text }]}>{item.word}</Text>
                  {isMatched && (
                    <View style={styles.matchedOverlay}>
                      <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item.id}
            scrollEnabled={true}
            contentContainerStyle={styles.columnContent}
          />
        </View>
      </View>
      
      <View style={[styles.gameControls, { borderTopColor: theme.border }]}>
        <View style={styles.gameStats}>
          <View style={styles.statRow}>
            <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.controlText, { color: theme.textSecondary }]}>{formatTime(currentTime)}</Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.controlText, { color: theme.textSecondary }]}>{mistakes}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            isBatchComplete() ? 
              { backgroundColor: theme.primary } : 
              { backgroundColor: theme.primary + '50' },
            styles.continueButton
          ]}
          onPress={() => {
            if (isBatchComplete()) {
              if (currentBatchIndex + 1 < totalBatches && totalMatchedPairs < allPairs.length) {
                handleContinueToNextBatch();
              } else {
                completeGame();
              }
            }
          }}
          disabled={!isBatchComplete()}
        >
          <Ionicons name="arrow-forward" size={20} color={theme.onPrimary} />
          <Text style={[styles.continueButtonText, { color: theme.onPrimary }]}>
            {t('quiz_button_continue')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={gameComplete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGameComplete(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.resultsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: theme.text }]}>{t('matching_complete_title')}</Text>
              <Text style={[styles.resultsSubtitle, { color: theme.textSecondary }]}>{selectedCategory?.title}</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#FF9800" />
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('matching_time_taken')}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{formatTime(gameDuration)}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={24} color="#F44336" />
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('matching_mistakes')}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{mistakes}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="checkmark-done-circle" size={24} color="#4CAF50" />
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('matching_pairs_matched')}</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{allPairs.length}</Text>
              </View>
            </View>
            
            <View style={styles.resultButtons}>
              <TouchableOpacity
                style={[styles.resultsButton, { backgroundColor: theme.primary }]}
                onPress={handleRestartGame}
              >
                <Ionicons name="refresh" size={20} color={theme.onPrimary} style={styles.buttonIcon} />
                <Text style={[styles.resultsButtonText, { color: theme.onPrimary }]}>{t('matching_play_again')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resultsSecondaryButton, { borderColor: theme.border }]}
                onPress={handleChooseNewCategory}
              >
                <Ionicons name="grid" size={20} color={theme.text} style={styles.buttonIcon} />
                <Text style={[styles.resultsSecondaryButtonText, { color: theme.text }]}>
                  {t('matching_new_category')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, alignItems: 'center' },
  headerText: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subText: { fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gameContainer: { flex: 1, flexDirection: 'row', padding: 8 },
  column: { flex: 1, margin: 4 },
  columnContent: { paddingVertical: 4 },
  videoItem: { height: 100, marginVertical: 4, borderRadius: 8, borderWidth: 2, overflow: 'hidden' },
  textItem: {
    height: 100,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  textContent: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  matchedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  gameControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderTopWidth: 1 
  },
  gameStats: { flexDirection: 'row' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  controlText: { fontSize: 16, marginLeft: 6 },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8
  },
  continueButtonText: { fontSize: 16, marginLeft: 6 },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  categoryListItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  categoryListItemLocked: { opacity: 0.7 },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 16
  },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold' },
  categoryCount: { fontSize: 14, marginTop: 2 },
  resultsContainer: {
    width: width * 0.9,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center'
  },
  resultsHeader: { alignItems: 'center', marginBottom: 20 },
  resultsTitle: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  resultsSubtitle: { fontSize: 16, textAlign: 'center' },
  statsContainer: { width: '100%', marginBottom: 24 },
  statItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  statLabel: { flex: 1, marginLeft: 16, fontSize: 16 },
  statValue: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  resultButtons: { width: '100%' },
  resultsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16
  },
  resultsSecondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1
  },
  resultsButtonText: { fontSize: 16, fontWeight: 'bold' },
  resultsSecondaryButtonText: { fontSize: 16, fontWeight: '500' },
  buttonIcon: { marginRight: 8 }
});

export default MatchingGameScreen;
