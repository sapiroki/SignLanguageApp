import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { resetLearnedSigns } from '../utils/learningUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CUSTOM_TIPS_STORAGE_KEY } from '../components/CustomTipBox';

const LEARNED_SIGNS_KEY = '@estonian_sign_app:learned_signs';
const STORAGE_KEYS = {
  LEARN_SIGNS_COUNT: 'learnSignsCount',
  REPEAT_SIGNS_COUNT: 'repeatSignsCount',
  AUTO_PLAY_VIDEOS: 'autoPlayVideos',
  LEARNING_MODE: 'learningMode',
};

const DEFAULT_VALUES = {
  LEARN_SIGNS_COUNT: 5,
  REPEAT_SIGNS_COUNT: 5,
  AUTO_PLAY_VIDEOS: true,
  LEARNING_MODE: 'both',
};

const SIGN_COUNT_OPTIONS = [3, 5, 7, 10];
const LEARNING_MODE_OPTIONS = [
  { id: 'video-to-text', translationKey: 'mode_video_to_text', descriptionKey: 'mode_video_description' },
  { id: 'text-to-video', translationKey: 'mode_text_to_video', descriptionKey: 'mode_text_description' },
  { id: 'both', translationKey: 'mode_both', descriptionKey: 'mode_both_description' },
];

const SettingsScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  
  const [autoPlayVideos, setAutoPlayVideos] = useState(DEFAULT_VALUES.AUTO_PLAY_VIDEOS);
  const [learnSignsCount, setLearnSignsCount] = useState(DEFAULT_VALUES.LEARN_SIGNS_COUNT);
  const [repeatSignsCount, setRepeatSignsCount] = useState(DEFAULT_VALUES.REPEAT_SIGNS_COUNT);
  const [learningMode, setLearningMode] = useState(DEFAULT_VALUES.LEARNING_MODE);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';
  
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const learnCountStr = await AsyncStorage.getItem(STORAGE_KEYS.LEARN_SIGNS_COUNT);
        const repeatCountStr = await AsyncStorage.getItem(STORAGE_KEYS.REPEAT_SIGNS_COUNT);
        const autoPlayStr = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_PLAY_VIDEOS);
        const learningModeStr = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_MODE);
        
        if (learnCountStr !== null) setLearnSignsCount(parseInt(learnCountStr, 10));
        if (repeatCountStr !== null) setRepeatSignsCount(parseInt(repeatCountStr, 10));
        if (autoPlayStr !== null) setAutoPlayVideos(autoPlayStr === 'true');
        if (learningModeStr !== null) setLearningMode(learningModeStr);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);
  
  const saveSignCountPreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Failed to save ${key} preference:`, error);
    }
  };
  
  const handleLearnSignsCountChange = (value) => {
    setLearnSignsCount(value);
    saveSignCountPreference(STORAGE_KEYS.LEARN_SIGNS_COUNT, value);
  };
  
  const handleRepeatSignsCountChange = (value) => {
    setRepeatSignsCount(value);
    saveSignCountPreference(STORAGE_KEYS.REPEAT_SIGNS_COUNT, value);
  };
  
  const handleAutoPlayToggle = (value) => {
    setAutoPlayVideos(value);
    try {
      AsyncStorage.setItem(STORAGE_KEYS.AUTO_PLAY_VIDEOS, value.toString());
    } catch (error) {
      console.error('Failed to save auto-play preference:', error);
    }
  };
  
  const handleLearningModeChange = (mode) => {
    setLearningMode(mode);
    setShowModeModal(false);
    try {
      AsyncStorage.setItem(STORAGE_KEYS.LEARNING_MODE, mode);
    } catch (error) {
      console.error('Failed to save learning mode preference:', error);
    }
  };

  const handleLanguageChange = async (langCode) => {
    setShowLanguageModal(false);
    
    if (langCode !== currentLanguage) {
      await changeLanguage(langCode);
    }
  };
  
  const renderNumberOptions = (selectedValue, onSelect) => (
    <View style={styles.numberOptionsContainer}>
      {SIGN_COUNT_OPTIONS.map(value => (
        <TouchableOpacity
          key={value}
          style={[
            styles.numberOption,
            selectedValue === value && styles.selectedNumberOption,
            { 
              borderColor: theme.border, 
              backgroundColor: selectedValue === value ? theme.primary : theme.surface 
            }
          ]}
          onPress={() => onSelect(value)}
        >
          <Text 
            style={[
              styles.numberOptionText,
              { color: selectedValue === value ? theme.onPrimary : theme.text }
            ]}
          >
            {value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLearningModeTrigger = () => {
    const selectedMode = LEARNING_MODE_OPTIONS.find(option => option.id === learningMode) || LEARNING_MODE_OPTIONS[2];
    
    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={[styles.dropdownTrigger, { borderColor: theme.border, backgroundColor: theme.surface }]} 
          onPress={() => setShowModeModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectedOptionContent}>
            <Text style={[styles.dropdownLabel, { color: theme.text }]}>{t(selectedMode.translationKey)}</Text>
            <Text style={[styles.dropdownDescription, { color: theme.textSecondary }]}>{t(selectedMode.descriptionKey)}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLanguageTrigger = () => {
    const selectedLanguage = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];
    
    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={[styles.dropdownTrigger, { borderColor: theme.border, backgroundColor: theme.surface }]} 
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectedOptionContent}>
            <Text style={[styles.dropdownLabel, { color: theme.text }]}>{selectedLanguage.name}</Text>
            <Text style={[styles.dropdownDescription, { color: theme.textSecondary }]}>
              {selectedLanguage.nativeName}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleClearData = () => {
    Alert.alert(
      t("settings_clear_data"),
      "Are you sure you want to clear all app data? This will reset your progress and favorites.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: t("settings_clear_data"), 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(LEARNED_SIGNS_KEY);
              await AsyncStorage.removeItem('@estonian_sign_app:favorite_signs');
              await AsyncStorage.removeItem(CUSTOM_TIPS_STORAGE_KEY);
              await AsyncStorage.removeItem(STORAGE_KEYS.LEARN_SIGNS_COUNT);
              await AsyncStorage.removeItem(STORAGE_KEYS.REPEAT_SIGNS_COUNT);
              await AsyncStorage.removeItem(STORAGE_KEYS.AUTO_PLAY_VIDEOS);
              await AsyncStorage.removeItem(STORAGE_KEYS.LEARNING_MODE);
              
              Alert.alert("Data Cleared", "All app data has been reset successfully.");
              
              setLearnSignsCount(DEFAULT_VALUES.LEARN_SIGNS_COUNT);
              setRepeatSignsCount(DEFAULT_VALUES.REPEAT_SIGNS_COUNT);
              setAutoPlayVideos(DEFAULT_VALUES.AUTO_PLAY_VIDEOS);
              setLearningMode(DEFAULT_VALUES.LEARNING_MODE);
            } catch (error) {
              console.error('Error clearing app data:', error);
              Alert.alert("Error", "There was a problem clearing your app data.");
            }
          }
        }
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      t("settings_reset_progress"),
      "Are you sure you want to reset your learning progress? This will mark all signs as not learned.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: t("settings_reset_progress"), 
          style: "destructive",
          onPress: async () => {
            const success = await resetLearnedSigns();
            if (success) {
              Alert.alert("Progress Reset", "Your learning progress has been reset.");
            } else {
              Alert.alert("Error", "There was a problem resetting your progress.");
            }
          }
        }
      ]
    );
  };

  const handleSendFeedback = () => {
    Linking.openURL('mailto:kirill.shapiro1@gmail.com?subject=Estonian Sign Language App Feedback')
      .catch(err => {
        console.error('An error occurred when trying to open email client', err);
        Alert.alert(
          t('feedback_error_title'),
          t('feedback_error_message'),
          [{ text: 'OK' }]
        );
      });
  };

  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: theme.background,
    },
    header: {
      ...styles.header,
      backgroundColor: theme.surface,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    section: {
      backgroundColor: theme.surface,
      marginTop: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginLeft: 16,
      marginTop: 8,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    settingNameContainer: {
      flex: 1,
      marginRight: 12,
    },
    settingName: {
      fontSize: 16,
      color: theme.text,
    },
    settingDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    switchContainer: {
      width: 50,
      alignItems: 'flex-end',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    buttonText: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 12,
    },
    versionContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
    },
    version: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    buildNumber: {
      fontSize: 13,
      color: theme.textSecondary,
      opacity: 0.8,
    },
    attributionContainer: {
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: 16,
      marginBottom: 10,
      marginTop: 10,
    },
    attributionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    attributionText: {
      fontSize: 15,
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
      lineHeight: 22,
    },
    attributionLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    attributionLink: {
      paddingVertical: 3,
    },
    linkText: {
      color: theme.primary,
      fontSize: 15,
      textDecorationLine: 'underline',
    },
    attributionLicense: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    numberOptionsLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
    numberOptionsDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
  };
  
  return (
    <SafeAreaView style={themedStyles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>{t('settings_appearance')}</Text>
          
          <View style={[themedStyles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={themedStyles.numberOptionsLabel}>{t('settings_language')}</Text>
            <Text style={themedStyles.numberOptionsDescription}>{t('settings_choose_language')}</Text>
            {renderLanguageTrigger()}
          </View>
          
          <View style={themedStyles.settingRow}>
            <View style={themedStyles.settingNameContainer}>
              <Text style={themedStyles.settingName}>{t('settings_dark_mode')}</Text>
              <Text style={themedStyles.settingDescription}>{t('settings_dark_mode_description')}</Text>
            </View>
            <View style={themedStyles.switchContainer}>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#ddd", true: "#81b0ff" }}
                thumbColor={isDarkMode ? theme.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>
        
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>{t('settings_learning')}</Text>
          
          <View style={[themedStyles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={themedStyles.numberOptionsLabel}>{t('settings_quiz_mode')}</Text>
            <Text style={themedStyles.numberOptionsDescription}>{t('settings_quiz_mode_description')}</Text>
            {renderLearningModeTrigger()}
          </View>
          
          <View style={[themedStyles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={themedStyles.numberOptionsLabel}>{t('settings_signs_per_session')}</Text>
            <Text style={themedStyles.numberOptionsDescription}>{t('settings_signs_session_description')}</Text>
            {renderNumberOptions(learnSignsCount, handleLearnSignsCountChange)}
          </View>
          
          <View style={[themedStyles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0 }]}>
            <Text style={themedStyles.numberOptionsLabel}>{t('settings_signs_per_review')}</Text>
            <Text style={themedStyles.numberOptionsDescription}>{t('settings_signs_review_description')}</Text>
            {renderNumberOptions(repeatSignsCount, handleRepeatSignsCountChange)}
          </View>
        </View>
        
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>{t('settings_app_settings')}</Text>
          
          <View style={themedStyles.settingRow}>
            <View style={themedStyles.settingNameContainer}>
              <Text style={themedStyles.settingName}>{t('settings_autoplay_videos')}</Text>
              <Text style={themedStyles.settingDescription}>{t('settings_autoplay_description')}</Text>
            </View>
            <View style={themedStyles.switchContainer}>
              <Switch
                value={autoPlayVideos}
                onValueChange={handleAutoPlayToggle}
                trackColor={{ false: "#ddd", true: "#81b0ff" }}
                thumbColor={autoPlayVideos ? theme.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>{t('settings_data_management')}</Text>
          <TouchableOpacity style={themedStyles.button} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
            <Text style={[themedStyles.buttonText, { color: '#ff3b30' }]}>{t('settings_clear_data')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={themedStyles.button} onPress={handleResetProgress}>
            <Ionicons name="refresh-outline" size={20} color="#ff3b30" />
            <Text style={[themedStyles.buttonText, { color: '#ff3b30' }]}>{t('settings_reset_progress')}</Text>
          </TouchableOpacity>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>{t('settings_about')}</Text>
          
          <TouchableOpacity style={themedStyles.button} onPress={handleSendFeedback}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={themedStyles.buttonText}>{t('settings_send_feedback')}</Text>
          </TouchableOpacity>
          
          <View style={themedStyles.attributionContainer}>
            <Text style={themedStyles.attributionTitle}>{t('settings_attribution_title')}</Text>
            <Text style={themedStyles.attributionText}>{t('settings_attribution_eki')}</Text>
            
            <View style={themedStyles.attributionLinks}>
              <Text style={themedStyles.attributionText}>© </Text>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://eki.ee/')}
                style={themedStyles.attributionLink}
              >
                <Text style={themedStyles.linkText}>{t('settings_eki_name')}</Text>
              </TouchableOpacity>
              
              <Text style={themedStyles.attributionText}> • </Text>
              
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://arhiiv.eki.ee/dict/viipekeel/')}
                style={themedStyles.attributionLink}
              >
                <Text style={themedStyles.linkText}>{t('settings_dict_name')}</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={themedStyles.attributionLicense}>{t('settings_attribution_license')}</Text>
          </View>
          
          <View style={themedStyles.versionContainer}>
            <Text style={themedStyles.version}>
              {t('settings_version', { version: appVersion })}
            </Text>
            <Text style={themedStyles.buildNumber}>
              {t('settings_build', { build: buildNumber })}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Learning Mode Modal */}
      <Modal
        visible={showModeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_quiz_mode')}</Text>
              <TouchableOpacity onPress={() => setShowModeModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              {LEARNING_MODE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.modalOption,
                    option.id === learningMode && styles.selectedModalOption,
                    { 
                      borderBottomColor: theme.border,
                      backgroundColor: option.id === learningMode ? theme.primary + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => handleLearningModeChange(option.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.modalOptionContent}>
                    <Text style={[styles.dropdownLabel, { color: theme.text }]}>
                      {t(option.translationKey)}
                    </Text>
                    <Text style={[styles.dropdownDescription, { color: theme.textSecondary }]}>
                      {t(option.descriptionKey)}
                    </Text>
                  </View>
                  {option.id === learningMode && (
                    <Ionicons name="checkmark" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              {availableLanguages.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.modalOption,
                    language.code === currentLanguage && styles.selectedModalOption,
                    { 
                      borderBottomColor: theme.border,
                      backgroundColor: language.code === currentLanguage ? theme.primary + '20' : 'transparent'
                    }
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.modalOptionContent}>
                    <Text style={[styles.dropdownLabel, { color: theme.text }]}>{language.name}</Text>
                    <Text style={[styles.dropdownDescription, { color: theme.textSecondary }]}>
                      {language.nativeName}
                    </Text>
                  </View>
                  {language.code === currentLanguage && (
                    <Ionicons name="checkmark" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
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
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  numberOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    width: '100%',
  },
  numberOption: {
    width: 60,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedNumberOption: {
    borderWidth: 2,
  },
  numberOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    width: '100%',
    marginVertical: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedOptionContent: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOptions: {
    paddingTop: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalOptionContent: {
    flex: 1,
  },
  selectedModalOption: {
    borderLeftWidth: 3,
  },
});

export default SettingsScreen;
