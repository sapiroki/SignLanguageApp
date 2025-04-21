import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import VideoPlayer from '../components/VideoPlayer';
import CustomTipBox from '../components/CustomTipBox';
import { markSignsAsLearned } from '../utils/learningUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedSigns } from '../utils/localizationUtils';

const QuizScreen = ({ route, navigation }) => {
  const { 
    signs = [], 
    title = 'Signs', 
    allCategorySigns = [],
    categoryId = null,
    isReview = false  
  } = route?.params || {};
  
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizSequence, setQuizSequence] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizDuration, setQuizDuration] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  const [learningMode, setLearningMode] = useState('both');
  const [questionTypes, setQuestionTypes] = useState([]);
  
  const [autoPlaySetting, setAutoPlaySetting] = useState(null);
  
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const mode = await AsyncStorage.getItem('learningMode');
        if (mode !== null) {
          setLearningMode(mode);
        }
        
        const autoPlayStr = await AsyncStorage.getItem('autoPlayVideos');
        setAutoPlaySetting(autoPlayStr === 'true');
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);
  
  useEffect(() => {
    if (Array.isArray(signs) && signs.length > 0) {
      const localizedSignsData = getLocalizedSigns(signs, currentLanguage);
      
      const duplicatedSigns = [...localizedSignsData, ...localizedSignsData];
      
      let quizItems = [];
      
      if (learningMode === 'video-to-text') {
        quizItems = duplicatedSigns.map(sign => ({
          sign,
          questionType: 'video-to-text'
        }));
      } else if (learningMode === 'text-to-video') {
        quizItems = duplicatedSigns.map(sign => ({
          sign,
          questionType: 'text-to-video'
        }));
      } else {
        quizItems = [];
        
        localizedSignsData.forEach(sign => {
          quizItems.push({
            sign,
            questionType: 'video-to-text'
          });
          
          quizItems.push({
            sign,
            questionType: 'text-to-video'
          });
        });
      }
      
      const shuffledQuizItems = quizItems.sort(() => 0.5 - Math.random());
      
      const finalSigns = shuffledQuizItems.map(item => item.sign);
      const finalTypes = shuffledQuizItems.map(item => item.questionType);
      
      setQuestionTypes(finalTypes);
      setQuizSequence(finalSigns);
      
      setQuizStartTime(Date.now());
    } else {
      Alert.alert(
        "Error",
        "No signs available for quiz",
        [{ text: "Go Back", onPress: () => navigation.goBack() }]
      );
    }
  }, [signs, learningMode, currentLanguage]); 
  
  const currentSign = quizSequence[currentQuestionIndex] || null;

  const currentQuestionType = questionTypes[currentQuestionIndex] || 'video-to-text';
  
  useEffect(() => {
    if (currentSign) {
      generateOptions();
    }
  }, [currentQuestionIndex, currentSign, currentQuestionType, currentLanguage]); 
  
  const generateOptions = () => {
    if (!currentSign) return;
    
    const localizedCategorySigns = getLocalizedSigns(allCategorySigns, currentLanguage);
    
    let newOptions = [currentSign];
    
    const otherSigns = localizedCategorySigns.filter(
      sign => sign.id !== currentSign.id
    );
    
    const shuffledSigns = [...otherSigns].sort(() => 0.5 - Math.random());
    const randomSigns = shuffledSigns.slice(0, Math.min(3, shuffledSigns.length));
    
    newOptions = [...newOptions, ...randomSigns];
    
    while (newOptions.length < 4 && currentSign) {
      newOptions.push(currentSign);
    }
    
    newOptions = newOptions.sort(() => 0.5 - Math.random());
    
    setOptions(newOptions);
  };
  
  const handleSelectOption = (option) => {
    setSelectedOption(option);
    
    if (option.id === currentSign.id) {
      setIsCorrect(true);
      setScore(score + 1);
      
      setTimeout(() => {
        moveToNextQuestion();
      }, 1200); 
    } else {
      setIsCorrect(false);
      setMistakesCount(mistakesCount + 1);
      
      setTimeout(() => {
        setShowingAnswer(true);
      }, 1500); 
    }
  };
  
  const handleTryAgain = () => {
    setShowingAnswer(false);
    setSelectedOption(null);
    setIsCorrect(null);
    generateOptions(); 
  };
  
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < quizSequence.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setShowingAnswer(false);
    } else {
      completeQuiz();
    }
  };
  
  const completeQuiz = async () => {
    const endTime = Date.now();
    const duration = Math.floor((endTime - quizStartTime) / 1000); 
    setQuizDuration(duration);
    
    const uniqueSignIds = [...new Set(quizSequence.map(sign => sign.id))]; 
    await markSignsAsLearned(uniqueSignIds);
    
    setShowResults(true);
    setIsQuizCompleted(true);
  };
  
  const handleContinueFromResults = () => {
    setShowResults(false);
    
    navigation.replace('Category', { id: categoryId, title: title });
  };
  
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: theme.background,
    },
    progressBar: {
      ...styles.progressBar,
      borderColor: theme.border,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    progressFill: {
      ...styles.progressFill,
      backgroundColor: theme.primary,
    },
    progressText: {
      ...styles.progressText,
      color: theme.textSecondary,
    },
    optionButton: {
      ...styles.optionButton,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    optionText: {
      ...styles.optionText,
      color: theme.text,
    },
    continueButton: {
      padding: 14,
      borderRadius: 8,
      backgroundColor: theme.primary,
      alignItems: 'center',
      marginTop: 16,
    },
    continueButtonText: {
      color: theme.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    resultsModalContent: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    resultsTitle: {
      color: theme.text,
    },
    resultsStatLabel: {
      color: theme.textSecondary,
    },
    resultsStatValue: {
      color: theme.text,
    },
    resultsContinueButton: {
      backgroundColor: theme.primary,
    },
    resultsContinueButtonText: {
      color: theme.onPrimary,
    },
    signPrompt: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginVertical: 20,
    },
    videoOptionButton: {
      width: '48%',
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
      overflow: 'hidden',
      backgroundColor: theme.surface,
    },
    videoOptionSelected: {
      borderWidth: 3,
      borderColor: theme.primary,
    },
    videoOptionCorrect: {
      borderWidth: 3,
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    videoOptionIncorrect: {
      borderWidth: 3,
      borderColor: '#F44336',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    signNameContainer: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: 'center',
      marginTop: -8,
    },
    signNameText: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      color: theme.text,  
      padding: 2,
      width: '100%',
    },
  };

  const totalQuestions = quizSequence.length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const renderTextToVideoQuestion = () => {
    return (
      <View style={styles.quizContainer}>
        <Text style={themedStyles.signPrompt}>
          {t('quiz_text_to_video_prompt')}
          {"\n"}
          <Text style={{fontWeight: 'bold'}}>{currentSign?.word}</Text>
        </Text>
        
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            let videoStyle = {...themedStyles.videoOptionButton};
            
            if (selectedOption) {
              if (option.id === currentSign.id) {
                videoStyle = {
                  ...videoStyle,
                  ...themedStyles.videoOptionCorrect,
                };
              } else if (selectedOption.id === option.id) {
                videoStyle = {
                  ...videoStyle,
                  ...themedStyles.videoOptionIncorrect,
                };
              }
            }
            
            return (
              <TouchableOpacity
                key={`${option.id}-${index}`}
                style={videoStyle}
                onPress={() => handleSelectOption(option)}
                disabled={!!selectedOption}
                activeOpacity={0.7}
              >
                <VideoPlayer 
                  videoUrl={option.videoUrl}
                  resizeMode="cover"
                  compact={true}
                  showControls={true}
                  muted={true}
                  autoPlay={autoPlaySetting}
                  disableFullscreenTouch={true}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderVideoToTextQuestion = () => {
    return (
      <View style={styles.quizContainer}>
        <View style={styles.videoContainer}>
          {currentSign && (
            <VideoPlayer 
              videoUrl={currentSign.videoUrl}
              autoPlay={autoPlaySetting} 
            />
          )}
        </View>
        
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            let buttonStyle = {...styles.optionButton};
            
            if (selectedOption) {
              if (option.id === currentSign.id) {
                buttonStyle = {
                  ...buttonStyle,
                  ...styles.correctOption
                };
              } else if (selectedOption.id === option.id) {
                buttonStyle = {
                  ...buttonStyle,
                  ...styles.incorrectOption
                };
              }
            }
            
            buttonStyle.backgroundColor = theme.surface;
            
            return (
              <TouchableOpacity
                key={`${option.id}-${index}`}
                style={buttonStyle}
                onPress={() => handleSelectOption(option)}
                disabled={!!selectedOption}
                activeOpacity={0.7}
              >
                <Text style={themedStyles.optionText}>{option.word}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  useEffect(() => {
    const preventNavigation = (e) => {
      if (showResults || isQuizCompleted) {
        return;
      }
      
      e.preventDefault();
      
      Alert.alert(
        t('learning_exit_title', 'Leave Learning Session?'),
        t('learning_exit_message', 'Are you sure you want to exit? Your progress in this learning session will not be saved.'),
        [
          { text: t('cancel', 'Cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('leave', 'Leave'),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    };

    const unsubscribe = navigation.addListener('beforeRemove', preventNavigation);
    
    return unsubscribe;
  }, [navigation, showResults, isQuizCompleted, t]);

  return (
    <SafeAreaView style={themedStyles.container}>
      <View style={styles.progressBarContainer}>
        <View style={themedStyles.progressBar}>
          <View 
            style={[
              themedStyles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={themedStyles.progressText}>
          {currentQuestionIndex + 1}/{totalQuestions}
        </Text>
      </View>
      
      {!showingAnswer ? (
        currentQuestionType === 'text-to-video' ? 
          renderTextToVideoQuestion() : 
          renderVideoToTextQuestion()
      ) : (
        <KeyboardAvoidingView 
          style={styles.quizContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
        >
          <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <View style={styles.videoContainer}>
              <VideoPlayer videoUrl={currentSign.videoUrl} />
            </View>
            
            <View style={themedStyles.signNameContainer}>
              <Text 
                style={themedStyles.signNameText} 
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {currentSign.word}
              </Text>
            </View>
            
            <View style={styles.reviewContentContainer}>
              <CustomTipBox 
                signId={currentSign?.id} 
                compact={true}
                containerStyle={{marginVertical: 4, marginHorizontal: 2}}
                interactive={true} 
              />
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={themedStyles.continueButton}
            onPress={handleTryAgain}
          >
            <Text style={themedStyles.continueButtonText}>{t('quiz_button_continue')}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      <Modal
        visible={showResults}
        animationType="fade"
        transparent={true}
        onRequestClose={handleContinueFromResults}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.resultsModal, themedStyles.resultsModalContent]}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, themedStyles.resultsTitle]}>
                {isReview ? t('quiz_review_title') : t('quiz_results_title')}
              </Text>
              <Text style={[styles.resultsSubtitle, themedStyles.resultsStatLabel]}>
                {title}
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              {isReview ? (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="refresh-circle" size={24} color={theme.primary} />
                    <Text style={[styles.statLabel, themedStyles.resultsStatLabel]}>{t('quiz_stats_signs_reviewed')}</Text>
                    <Text style={[styles.statValue, themedStyles.resultsStatValue]}>{signs.length}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                    <Text style={[styles.statLabel, themedStyles.resultsStatLabel]}>{t('quiz_stats_mistakes')}</Text>
                    <Text style={[styles.statValue, themedStyles.resultsStatValue]}>{mistakesCount}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={24} color="#FF9800" />
                    <Text style={[styles.statLabel, themedStyles.resultsStatLabel]}>{t('quiz_stats_time_taken')}</Text>
                    <Text style={[styles.statValue, themedStyles.resultsStatValue]}>
                      {formatTime(quizDuration)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    <Text style={[styles.statLabel, themedStyles.resultsStatLabel]}>{t('quiz_stats_signs_learned')}</Text>
                    <Text style={[styles.statValue, themedStyles.resultsStatValue]}>{signs.length}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                    <Text style={[styles.statLabel, themedStyles.resultsStatLabel]}>{t('quiz_stats_mistakes')}</Text>
                    <Text style={[styles.statValue, themedStyles.resultsStatValue]}>{mistakesCount}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={24} color="#FF9800" />
                    <Text style={[styles.statLabel, themedStyles.resultsStatLabel]}>{t('quiz_stats_time_taken')}</Text>
                    <Text style={[styles.statValue, themedStyles.resultsStatValue]}>
                      {formatTime(quizDuration)}
                    </Text>
                  </View>
                </>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.resultsContinueButton, themedStyles.resultsContinueButton]}
              onPress={handleContinueFromResults}
            >
              <Text style={[styles.resultsContinueButtonText, themedStyles.resultsContinueButtonText]}>
                {isReview ? t('quiz_button_back_to_category') : t('quiz_button_continue_results')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quizContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 20,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  optionButton: {
    width: '48%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.5)',
    borderColor: '#F44336',
    borderWidth: 3,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  signNameContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    marginTop: -8,
  },
  signNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 2,
    width: '100%',
  },
  reviewContentContainer: {
    flex: 1,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsModal: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsContinueButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4e92df',
    alignItems: 'center',
  },
  resultsContinueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuizScreen;
