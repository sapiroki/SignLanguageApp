import React, { useState, useEffect } from 'react';
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
import CustomTipBox from '../components/CustomTipBox';
import { signsData } from '../data/signs';
import { getLocalizedSigns, getLocalizedCategories } from '../utils/localizationUtils';
import { getAllCategoryCounts } from '../utils/signUtils';
import { getLearnedSigns } from '../utils/learningUtils';

const { width } = Dimensions.get('window');

const FlashcardsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  
  const [showCategoryModal, setShowCategoryModal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [learnedSigns, setLearnedSigns] = useState([]);
  const [categoryCompletionStatus, setCategoryCompletionStatus] = useState({});
  
  const localizedCategories = getLocalizedCategories(currentLanguage);
  const categoryCounts = getAllCategoryCounts();

  const categoriesWithCorrectCounts = localizedCategories.map(category => ({
    ...category,
    count: categoryCounts[category.id] || 0
  }));

  useEffect(() => {
    if (selectedCategory) {
      setLoading(true);
      const categorySignsData = signsData.filter(sign => sign.categoryId === selectedCategory.id);
      const localizedCategorySigns = getLocalizedSigns(categorySignsData, currentLanguage);
      const shuffledSigns = [...localizedCategorySigns].sort(() => 0.5 - Math.random());
      
      setFlashcards(shuffledSigns);
      setCurrentCardIndex(0);
      setKnownCount(0);
      setUnknownCount(0);
      setShowResults(false);
      setLoading(false);
    }
  }, [selectedCategory, currentLanguage]);
  
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
          
          const learnedInCategory = categorySigns.filter(sign => learned.includes(sign.id)).length;
          completionStatus[category.id] = (learnedInCategory === totalInCategory);
        });
        
        setCategoryCompletionStatus(completionStatus);
      } catch (error) {
        console.error('Error loading learned signs:', error);
      }
    };
    
    loadData();
  }, [localizedCategories]);
  
  const handleSelectCategory = (category) => {
    if (!categoryCompletionStatus[category.id]) {
      Alert.alert(
        t('flashcards_locked_title'),
        t('flashcards_locked_message'),
        [{ text: t('ok'), style: 'default' }]
      );
      return;
    }
    
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };
  
  const handleKnowSign = () => {
    setKnownCount(knownCount + 1);
    moveToNextCard();
  };
  
  const handleDontKnowSign = () => {
    setUnknownCount(unknownCount + 1);
    setShowAnswer(true);
  };
  
  const moveToNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    } else {
      setShowResults(true);
    }
  };
  
  const handleCardFlip = () => setFlipped(!flipped);
  const handleRestartSameCategory = () => {
    setCurrentCardIndex(0);
    setKnownCount(0);
    setUnknownCount(0);
    setShowResults(false);
    setShowAnswer(false);
    setFlipped(false);
    setFlashcards([...flashcards].sort(() => 0.5 - Math.random()));
  };
  
  const handleChooseNewCategory = () => {
    setShowCategoryModal(true);
    setShowResults(false);
    setCurrentCardIndex(0);
    setKnownCount(0);
    setUnknownCount(0);
    setShowAnswer(false);
    setFlipped(false);
  };
  
  const handleContinueAfterAnswer = () => {
    setShowAnswer(false);
    moveToNextCard();
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => navigation.goBack()}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('flashcards_select_category')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={categoriesWithCorrectCounts}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const isCompleted = categoryCompletionStatus[item.id];
              return (
                <TouchableOpacity 
                  style={[
                    styles.categoryListItem, 
                    { borderBottomColor: theme.border },
                    !isCompleted && { opacity: 0.7, backgroundColor: theme.surface + '80' }
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
                      {!isCompleted && ` • ${t('flashcards_category_locked')}`}
                    </Text>
                  </View>
                  {isCompleted ? 
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} /> : 
                    <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
                  }
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const renderResults = () => {
    const totalCards = knownCount + unknownCount;
    const recognitionRate = totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;
    
    return (
      <View style={styles.resultsScreenContainer}>
        <View style={[styles.resultsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.resultsHeader}>
            <Ionicons name="checkmark-circle" size={70} color="#4CAF50" />
            <Text style={[styles.resultsTitle, { color: theme.text }]}>{t('flashcards_completed_title')}</Text>
            <Text style={[styles.resultsSubtitle, { color: theme.textSecondary }]}>
              {t('flashcards_completed_subtitle')}
            </Text>
          </View>
          
          <View style={styles.resultsStatWrapper}>
            <View style={styles.resultsStatRow}>
              <View style={styles.resultsStat}>
                <Text style={[styles.resultsLabel, { color: theme.textSecondary }]}>{t('flashcards_total_signs')}</Text>
                <Text style={[styles.resultsValue, { color: theme.primary }]}>{totalCards}</Text>
              </View>
              <View style={styles.resultsStat}>
                <Text style={[styles.resultsLabel, { color: theme.textSecondary }]}>{t('flashcards_known_signs')}</Text>
                <Text style={[styles.resultsValue, { color: theme.primary }]}>{knownCount}</Text>
              </View>
            </View>
            
            <View style={styles.resultsStatDivider}>
              <View style={[styles.dividerLine, {backgroundColor: theme.border}]} />
            </View>
            
            <View style={styles.resultsPercentageContainer}>
              <Text style={[styles.resultsLabel, { color: theme.textSecondary }]}>{t('flashcards_recognition_rate')}</Text>
              <Text style={[styles.resultsValue, { color: theme.primary }, styles.percentageValue]}>{recognitionRate}%</Text>
            </View>
          </View>
          
          <View style={styles.resultsButtons}>
            <TouchableOpacity 
              style={[styles.resultsButton, { backgroundColor: theme.primary }]}
              onPress={handleRestartSameCategory}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={theme.onPrimary} style={styles.buttonIcon} />
              <Text style={[styles.resultsButtonText, { color: theme.onPrimary }]}>{t('flashcards_try_again')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.resultsSecondaryButton, { borderColor: theme.border }]}
              onPress={handleChooseNewCategory}
              activeOpacity={0.7}
            >
              <Ionicons name="grid" size={20} color={theme.text} style={styles.buttonIcon} />
              <Text style={[styles.resultsSecondaryButtonText, { color: theme.text }]}>{t('flashcards_new_category')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if ((!selectedCategory && !showCategoryModal) || showCategoryModal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{t('flashcards_title')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('flashcards_choose_category')}</Text>
        </View>
        {renderCategoryModal()}
      </SafeAreaView>
    );
  }

  if (loading || flashcards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('flashcards_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showResults) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {renderResults()}
      </SafeAreaView>
    );
  }

  const currentCard = flashcards[currentCardIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {`${selectedCategory.title} - ${currentCardIndex + 1}/${flashcards.length}`}
        </Text>
      </View>
      
      {!showAnswer ? (
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleCardFlip}
          >
            {!flipped ? (
              <>
                <View style={styles.videoContainer}>
                  <VideoPlayer 
                    videoUrl={currentCard.videoUrl} 
                    autoPlay={true}
                    showControls={true}
                  />
                </View>
                <Text style={[styles.flipHint, { color: theme.textSecondary }]}>
                  {t('flashcards_tap_to_flip')}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.wordContainer}>
                  <Text style={[styles.wordText, { color: theme.text }]}>{currentCard.word}</Text>
                </View>
                <Text style={[styles.flipHint, { color: theme.textSecondary }]}>
                  {t('flashcards_tap_to_flip_back')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { color: theme.text }]}>
              {t('flashcards_do_you_know')}
            </Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.buttonBase, { backgroundColor: theme.textSecondary }]}
                onPress={handleDontKnowSign}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{t('flashcards_no')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.buttonBase, { backgroundColor: theme.primary }]}
                onPress={handleKnowSign}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{t('flashcards_yes')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.cardContainer}>
          <View style={[styles.answerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.videoContainer}>
              <VideoPlayer 
                videoUrl={currentCard.videoUrl}
                autoPlay={true}
                showControls={true}
              />
            </View>
            
            <View style={styles.answerContent}>
              <Text style={[styles.answerTitle, { color: theme.text }]}>{currentCard.word}</Text>
              <CustomTipBox 
                signId={currentCard.id} 
                compact={true}
                containerStyle={{marginVertical: 2}}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: theme.primary }]}
              onPress={handleContinueAfterAnswer}
            >
              <Text style={[styles.continueButtonText, { color: theme.onPrimary }]}>
                {t('flashcards_next')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { flex: 1, padding: 16 },
  card: {
    flex: 1, 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden', 
    alignItems: 'center',
    justifyContent: 'center', 
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  videoContainer: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000' },
  wordContainer: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 },
  wordText: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  flipHint: { position: 'absolute', bottom: 10, fontSize: 14, opacity: 0.7 },
  questionContainer: { marginVertical: 16, alignItems: 'center' },
  questionText: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  buttonBase: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  answerContainer: {
    flex: 1, 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden', 
    padding: 0, 
    marginBottom: 20
  },
  answerContent: { padding: 20 },
  answerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  continueButton: { marginTop: 'auto', padding: 16, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: width * 0.9, maxHeight: '80%', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  categoryListItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
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
  resultsScreenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  resultsContainer: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultsTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  resultsSubtitle: { fontSize: 16, textAlign: 'center', marginTop: 4, opacity: 0.8 },
  resultsStatWrapper: { width: '100%', marginBottom: 24 },
  resultsStatRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  resultsStat: { alignItems: 'center', padding: 12, flex: 1 },
  resultsStatDivider: { width: '100%', alignItems: 'center', paddingVertical: 16 },
  dividerLine: { height: 1, width: '80%' },
  resultsPercentageContainer: { alignItems: 'center', paddingTop: 4 },
  resultsLabel: { fontSize: 14, marginBottom: 8 },
  resultsValue: { fontSize: 24, fontWeight: 'bold' },
  percentageValue: { fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  resultsButtons: { width: '100%' },
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
    borderWidth: 1,
    backgroundColor: 'transparent'
  },
  resultsButtonText: { fontSize: 16, fontWeight: 'bold' },
  resultsSecondaryButtonText: { fontSize: 16, fontWeight: '500' },
  buttonIcon: { marginRight: 8 }
});

export default FlashcardsScreen;
