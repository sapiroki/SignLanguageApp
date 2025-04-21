import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import translations from '../translations';

const DEFAULT_LANGUAGE = 'en';
const LANGUAGE_KEY = 'appLanguage';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [languageVersion, setLanguageVersion] = useState(1);
  
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        
        if (savedLanguage !== null) {
          setCurrentLanguage(savedLanguage);
        } else {
          const deviceLanguage = Localization.locale.split('-')[0];
          if (translations[deviceLanguage]) {
            setCurrentLanguage(deviceLanguage);
          }
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  const changeLanguage = async (languageCode) => {
    try {
      if (!translations[languageCode]) {
        console.error('Invalid language code:', languageCode);
        return false;
      }
      
      await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
      setCurrentLanguage(languageCode);
      
      setLanguageVersion(prev => prev + 1);
      
      return true;
    } catch (error) {
      console.error('Failed to save language preference:', error);
      return false;
    }
  };

  const t = (key, replacements = {}) => {
    let translation = translations[currentLanguage]?.[key];
    
    if (translation === undefined && currentLanguage !== DEFAULT_LANGUAGE) {
      translation = translations[DEFAULT_LANGUAGE]?.[key];
    }
    
    if (translation === undefined) {
      return key;
    }
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      translation = translation.replace(`{${placeholder}}`, value);
    });
    
    return translation;
  };

  const availableLanguages = useMemo(() => {
    return Object.keys(translations).map(code => ({
      code,
      name: translations[code]._language_name,
      nativeName: translations[code]._language_native_name
    }));
  }, []);

  const contextValue = useMemo(() => ({
    currentLanguage, 
    changeLanguage, 
    t,
    isLoading,
    languageVersion,
    availableLanguages
  }), [currentLanguage, isLoading, languageVersion, availableLanguages]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
