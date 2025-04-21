import { signsData } from '../data/signs';
import { categoryData } from '../data/categories';
import signTranslations from '../translations/signTranslations';
import categoryTranslations from '../translations/categoryTranslations';

export const getLocalizedSign = (signId, language = 'en') => {
  const signIdStr = signId.toString();
  const originalSign = signsData.find(sign => sign.id.toString() === signIdStr);
  
  if (!originalSign) {
    return null;
  }
  
  const translations = signTranslations[language]?.[signIdStr];
  
  if (!translations && language !== 'en') {
    const enTranslations = signTranslations.en[signIdStr];
    
    if (enTranslations) {
      return {
        ...originalSign,
        word: enTranslations.word || originalSign.word,
        description: enTranslations.description || originalSign.description,
        examples: enTranslations.examples || originalSign.examples
      };
    }
    
    return originalSign;
  }
  
  if (translations) {
    return {
      ...originalSign,
      word: translations.word || originalSign.word,
      description: translations.description || originalSign.description,
      examples: translations.examples || originalSign.examples
    };
  }
  
  return originalSign;
};

export const getLocalizedSigns = (signs, language = 'en') => {
  if (!Array.isArray(signs)) return [];
  
  const localizedSignsArray = signs.map(sign => {
    const signId = typeof sign === 'object' ? sign.id : sign;
    return getLocalizedSign(signId, language);
  }).filter(Boolean);
  
  return JSON.parse(JSON.stringify(localizedSignsArray));
};

export const getLocalizedCategoryTitle = (categoryId, language = 'en') => {
  const categoryIdStr = categoryId.toString();
  
  const translation = categoryTranslations[language]?.[categoryIdStr];
  
  if (translation) {
    return translation;
  }
  
  if (language !== 'en') {
    const enTranslation = categoryTranslations.en[categoryIdStr];
    if (enTranslation) {
      return enTranslation;
    }
  }
  
  const category = categoryData.find(cat => cat.id.toString() === categoryIdStr);
  return category?.title || '';
};

export const getLocalizedCategories = (language = 'en') => {
  return categoryData.map(category => ({
    ...category,
    title: getLocalizedCategoryTitle(category.id, language)
  }));
};
