import AsyncStorage from '@react-native-async-storage/async-storage';

const LEARNED_SIGNS_KEY = '@estonian_sign_app:learned_signs';

export const getLearnedSigns = async () => {
  try {
    const learnedJson = await AsyncStorage.getItem(LEARNED_SIGNS_KEY);
    return learnedJson ? JSON.parse(learnedJson) : [];
  } catch (error) {
    console.error('Error getting learned signs:', error);
    return [];
  }
};

export const markSignsAsLearned = async (signIds) => {
  if (!Array.isArray(signIds) || signIds.length === 0) return false;
  
  try {
    const learnedSigns = await getLearnedSigns();
    
    const updatedLearnedSigns = [...new Set([...learnedSigns, ...signIds])];
    
    await AsyncStorage.setItem(LEARNED_SIGNS_KEY, JSON.stringify(updatedLearnedSigns));
    return true;
  } catch (error) {
    console.error('Error marking signs as learned:', error);
    return false;
  }
};

export const resetLearnedSigns = async () => {
  try {
    await AsyncStorage.removeItem(LEARNED_SIGNS_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting learned signs:', error);
    return false;
  }
};

export const getNextSignsToLearn = async (signs = [], count = 5) => {
  if (!Array.isArray(signs) || signs.length === 0) {
    return [];
  }
  
  try {
    const learnedSigns = await getLearnedSigns();
    
    const notLearnedSigns = signs.filter(sign => !learnedSigns.includes(sign.id));
    
    if (notLearnedSigns.length === 0) {
      return [];
    }
    
    return notLearnedSigns.slice(0, count);
  } catch (error) {
    console.error('Error getting next signs to learn:', error);
    return [];
  }
};
