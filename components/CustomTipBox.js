import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CUSTOM_TIPS_STORAGE_KEY = '@estonian_sign_app:custom_tips';

const CustomTipBox = ({ 
  signId, 
  showTitle = true,
  compact = false,
  containerStyle = {}
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [customTip, setCustomTip] = useState('');
  const [savedTip, setSavedTip] = useState('');

  useEffect(() => {
    const loadCustomTip = async () => {
      if (signId) {
        try {
          const savedTips = await AsyncStorage.getItem(CUSTOM_TIPS_STORAGE_KEY);
          const tipsObject = savedTips ? JSON.parse(savedTips) : {};
          
          if (tipsObject[signId]) {
            setSavedTip(tipsObject[signId]);
            setCustomTip(tipsObject[signId]);
          } else {
            setSavedTip('');
            setCustomTip('');
          }
        } catch (error) {
          console.error('Error loading custom tip:', error);
        }
      }
    };
    
    loadCustomTip();
  }, [signId]);

  const saveCustomTip = async () => {
    if (!signId) return;
    
    try {
      const savedTips = await AsyncStorage.getItem(CUSTOM_TIPS_STORAGE_KEY);
      const tipsObject = savedTips ? JSON.parse(savedTips) : {};
      
      if (customTip.trim() === '') {
        delete tipsObject[signId];
      } else {
        tipsObject[signId] = customTip;
      }
      
      await AsyncStorage.setItem(CUSTOM_TIPS_STORAGE_KEY, JSON.stringify(tipsObject));
      setSavedTip(customTip);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving custom tip:', error);
    }
  };

  const cancelEditing = () => {
    setCustomTip(savedTip);
    setIsEditing(false);
  };

  useEffect(() => {
    return () => {
      setCustomTip('');
      setSavedTip('');
      setIsEditing(false);
    };
  }, []);

  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      ...(compact && styles.compactContainer),
      ...containerStyle,
    },
    title: {
      ...styles.title,
      color: theme.text,
      ...(compact && styles.compactTitle),
    },
    content: {
      ...styles.content,
      color: theme.textSecondary,
      ...(compact && styles.compactContent),
    },
    editButton: {
      ...styles.editButton,
      backgroundColor: theme.background,
      ...(compact && styles.compactEditButton),
    },
    editButtonIcon: {
      color: theme.textSecondary,
    },
    textInput: {
      ...styles.textInput,
      color: theme.text,
      backgroundColor: theme.background,
      borderColor: theme.border,
      ...(compact && styles.compactTextInput),
    },
    buttonRow: {
      ...styles.buttonRow,
    },
    saveButton: {
      ...styles.button,
      backgroundColor: theme.primary,
    },
    saveButtonText: {
      ...styles.buttonText,
      color: theme.onPrimary,
    },
    cancelButton: {
      ...styles.button,
      backgroundColor: 'transparent',
      borderColor: theme.border,
      borderWidth: 1,
    },
    cancelButtonText: {
      ...styles.buttonText,
      color: theme.text,
    },
    placeholder: {
      ...styles.placeholder,
      color: theme.textSecondary,
      ...(compact && styles.compactPlaceholder),
    }
  };

  return (
    <View style={themedStyles.container}>
      {showTitle && (
        <View style={styles.titleRow}>
          <Ionicons 
            name="information-circle" 
            size={compact ? 16 : 20} 
            color={theme.primary} 
          />
          <Text style={themedStyles.title}>{t('how_to_sign_tip')}</Text>
          
          {!isEditing && (
            <TouchableOpacity 
              style={themedStyles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons 
                name="pencil" 
                size={compact ? 14 : 18} 
                color={themedStyles.editButtonIcon.color} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {isEditing ? (
        <>
          <TextInput
            style={themedStyles.textInput}
            multiline={true}
            value={customTip}
            onChangeText={setCustomTip}
            placeholder={t('enter_custom_tip')}
            placeholderTextColor={themedStyles.placeholder.color}
          />
          <View style={themedStyles.buttonRow}>
            <TouchableOpacity style={themedStyles.cancelButton} onPress={cancelEditing}>
              <Text style={themedStyles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={themedStyles.saveButton} onPress={saveCustomTip}>
              <Text style={themedStyles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text 
          style={themedStyles.content}
          numberOfLines={compact ? 2 : undefined}
        >
          {savedTip || t('no_custom_tip')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  compactContainer: {
    padding: 10,
    marginVertical: 6, 
    borderRadius: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    marginLeft: 6,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  compactContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  editButton: {
    padding: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactEditButton: {
    padding: 4,
    borderRadius: 10,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  compactTextInput: {
    padding: 8,
    fontSize: 14,
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  compactPlaceholder: {
    fontSize: 13,
  }
});

export default CustomTipBox;